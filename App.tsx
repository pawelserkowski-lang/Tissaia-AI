import React, { useState, useEffect } from 'react';
import FileListView from './components/FileListView';
import CropMapView from './components/CropMapView';
import MagicSpellView from './components/MagicSpellView';
import Launcher from './components/Launcher';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { ViewMode, ScanFile, ScanStatus, DetectedCrop } from './types';
import { INITIAL_MOCK_FILES, MOCK_CROPS, MOCK_RESULTS } from './data/mockData';
import { GoogleGenAI, Type, Schema } from "@google/genai";

const BACKGROUND_URL = "https://raw.githubusercontent.com/pawelserkowski-lang/Tissaia/bff8a21525d062a8c63229ef5edf530782c8943e/lib/background.jpg";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.FILES);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  // File State
  const [files, setFiles] = useState<ScanFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Initialize GenAI
  // @ts-ignore - Process env is handled by build system/runtime
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Load Initial Data on Login
  useEffect(() => {
    if (isAuthenticated && files.length === 0) {
        setFiles(INITIAL_MOCK_FILES);
    }
  }, [isAuthenticated]);

  const handleSelectScan = (id: string) => {
    setSelectedScanId(id);
    setActiveView(ViewMode.CROP_MAP);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    files.forEach(f => {
        if (f.thumbnailUrl && f.thumbnailUrl.startsWith('blob:')) {
            URL.revokeObjectURL(f.thumbnailUrl);
        }
    });
    setFiles([]);
    setActiveView(ViewMode.FILES);
  };

  const fileToGenerativePart = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data url prefix (e.g. "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImageWithGemini = async (file: File, fileId: string) => {
    try {
        const base64Data = await fileToGenerativePart(file);
        
        const responseSchema: Schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    ymin: { type: Type.NUMBER },
                    xmin: { type: Type.NUMBER },
                    ymax: { type: Type.NUMBER },
                    xmax: { type: Type.NUMBER },
                },
                required: ["label", "confidence", "ymin", "xmin", "ymax", "xmax"]
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: "Identify the main objects or regions of interest in this image. For each object, provide a label, a confidence score (0-1), and a bounding box using 0-1000 scale." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                systemInstruction: "You are a computer vision engine for a forensic architecture dashboard. Be precise."
            }
        });

        const rawText = response.text;
        if (!rawText) throw new Error("No data returned from AI");

        const detectedObjects = JSON.parse(rawText) as any[];
        
        const crops: DetectedCrop[] = detectedObjects.map((obj, idx) => ({
            id: `ai-${fileId}-${idx}`,
            label: obj.label,
            confidence: obj.confidence,
            ymin: obj.ymin,
            xmin: obj.xmin,
            ymax: obj.ymax,
            xmax: obj.xmax
        }));

        setFiles(prev => prev.map(f => {
            if (f.id === fileId) {
                return { 
                    ...f, 
                    status: ScanStatus.CROPPED, 
                    detectedCount: crops.length,
                    aiData: crops
                };
            }
            return f;
        }));

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        setFiles(prev => prev.map(f => {
            if (f.id === fileId) return { ...f, status: ScanStatus.ERROR };
            return f;
        }));
    }
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    const newFiles: ScanFile[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: ScanStatus.UPLOADING,
      detectedCount: 0,
      uploadProgress: 0,
      thumbnailUrl: URL.createObjectURL(file),
      rawFile: file
    }));

    setFiles(prev => [...newFiles, ...prev]);

    // Process each file
    newFiles.forEach(scanFile => {
        if (!scanFile.rawFile) return;

        // Simulate upload time then trigger AI
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress >= 100) {
                clearInterval(interval);
                // Update status to detecting
                setFiles(prev => prev.map(f => {
                    if (f.id === scanFile.id) return { ...f, status: ScanStatus.DETECTING, uploadProgress: undefined };
                    return f;
                }));
                // Trigger Gemini
                analyzeImageWithGemini(scanFile.rawFile!, scanFile.id);
            } else {
                setFiles(prev => prev.map(f => {
                    if (f.id === scanFile.id) return { ...f, uploadProgress: progress };
                    return f;
                }));
            }
        }, 50);
    });
  };

  const selectedFile = files.find(f => f.id === selectedScanId) || null;
  // Use AI data if available, otherwise mock data for initial demo files
  const currentCrops = selectedFile?.aiData || (selectedFile && MOCK_CROPS) || [];

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-tissaia-accent selection:text-black relative overflow-hidden">
      {/* Global Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: `url('${BACKGROUND_URL}')` }}
      >
         <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/90 backdrop-blur-[2px]"></div>
      </div>

      {!isAuthenticated ? (
        <Launcher onLogin={handleLogin} />
      ) : (
        <>
            <Sidebar activeView={activeView} setActiveView={setActiveView} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-500 animate-fade-in-up">
                <TopBar 
                    activeView={activeView} 
                    selectedFile={selectedFile} 
                    onLogout={handleLogout} 
                />

                {/* Workspace */}
                <div className="flex-1 p-8 overflow-hidden">
                    {activeView === ViewMode.FILES && (
                        <FileListView 
                            files={files}
                            isLoading={isLoadingFiles} 
                            onUpload={handleFileUpload}
                            onSelect={handleSelectScan}
                        />
                    )}

                    {activeView === ViewMode.CROP_MAP && (
                        <CropMapView 
                            scan={selectedFile} 
                            crops={currentCrops as DetectedCrop[]} 
                        />
                    )}

                    {activeView === ViewMode.MAGIC_SPELL && (
                        <MagicSpellView 
                            photos={MOCK_RESULTS} 
                        />
                    )}
                </div>
            </main>
        </>
      )}
    </div>
  );
};

export default App;