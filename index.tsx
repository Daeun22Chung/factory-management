/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Inform TypeScript about the global firebase object from the script tag
declare const firebase: any;

// =================================================================================
// TODO: PASTE YOUR FIREBASE CONFIGURATION HERE
// 1. Go to your Firebase project settings.
// 2. In the "General" tab, find your web app under "Your apps".
// 3. Select "Config" to find your firebaseConfig object.
// 4. Copy and paste it here to replace the placeholder object.
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBNN0zX54DcIyPk71vw5FY_3wIZuW6XLhk",
  authDomain: "factory-management-app-f9045.firebaseapp.com",
  databaseURL: "https://factory-management-app-f9045-default-rtdb.firebaseio.com",
  projectId: "factory-management-app-f9045",
  storageBucket: "factory-management-app-f9045.firebasestorage.app",
  messagingSenderId: "576149816158",
  appId: "1:576149816158:web:05be75534da2e3cda785cf"
};
// Initialize Firebase only if the config is valid
let db: any = null;
let buildingsRef: any = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        buildingsRef = db.ref('buildings');
    } catch (e) {
        console.error("Error initializing Firebase:", e);
    }
}


const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// --- Type Definitions ---
interface Equipment {
    id: string;
    name: string;
    description: string;
    inspectionDate: string;
    issueDate: string;
    position: { x: number; y: number };
}

interface Building {
    id: string;
    name: string;
    floorPlan: string | null;
    equipment: { [key: string]: Equipment };
}

type EquipmentFormData = Omit<Equipment, 'id' | 'position'>;

// --- Component Props Interfaces ---
interface EquipmentFormProps {
    selectedEquipment: Equipment | undefined;
    onSave: (data: EquipmentFormData) => void;
    onClearSelection: () => void;
    onDelete: (id: string) => void;
}

interface EquipmentPanelProps {
    building: Building;
    selectedEquipmentId: string | null;
    onSelectEquipment: (id: string) => void;
    onClearSelection: () => void;
    onSave: (id: string, data: EquipmentFormData) => void;
    onDelete: (id: string) => void;
}

interface FloorPlanProps {
    building: Building;
    selectedEquipmentId: string | null;
    onAddEquipment: (position: { x: number; y: number }) => void;
    onSelectEquipment: (id: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface BuildingViewProps {
    building: Building;
    onUpdateBuilding: (building: Building) => void;
}

const EquipmentForm = ({ selectedEquipment, onSave, onClearSelection, onDelete }: EquipmentFormProps) => {
    const [formData, setFormData] = useState<EquipmentFormData>({
        name: '',
        description: '',
        inspectionDate: '',
        issueDate: '',
    });

    useEffect(() => {
        if (selectedEquipment) {
            setFormData({
                name: selectedEquipment.name || '',
                description: selectedEquipment.description || '',
                inspectionDate: selectedEquipment.inspectionDate || '',
                issueDate: selectedEquipment.issueDate || '',
            });
        } else {
             setFormData({ name: '', description: '', inspectionDate: '', issueDate: '' });
        }
    }, [selectedEquipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form className="equipment-form" onSubmit={handleSubmit}>
            <h3>{selectedEquipment?.id ? '장비 정보 수정' : '새 장비 추가'}</h3>
            <div className="form-group">
                <label htmlFor="name">장비 이름</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="description">설명 (관리 현황 등)</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
            </div>
            <div className="form-group">
                <label htmlFor="inspectionDate">점검 일자</label>
                <input type="date" id="inspectionDate" name="inspectionDate" value={formData.inspectionDate} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label htmlFor="issueDate">이슈 발생 일자</label>
                <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} />
            </div>
            <div className="form-actions">
                <button type="submit" className="btn btn-save">저장</button>
                {selectedEquipment?.id && <button type="button" className="btn btn-delete" onClick={() => onDelete(selectedEquipment!.id)}>삭제</button>}
                <button type="button" className="btn btn-clear" onClick={onClearSelection}>선택 해제</button>
            </div>
        </form>
    );
};


const EquipmentPanel = ({ building, onSave, onDelete, selectedEquipmentId, onSelectEquipment, onClearSelection }: EquipmentPanelProps) => {
    const equipmentList: Equipment[] = building.equipment ? Object.values(building.equipment) : [];
    const selectedEquipment = equipmentList.find(eq => eq.id === selectedEquipmentId);
    
    return (
        <div className="equipment-panel">
            {selectedEquipmentId && selectedEquipment ? (
                <EquipmentForm
                    selectedEquipment={selectedEquipment}
                    onSave={(data) => onSave(selectedEquipmentId, data)}
                    onClearSelection={onClearSelection}
                    onDelete={onDelete}
                />
            ) : (
                <>
                    <h3>{building.name} 장비 목록</h3>
                    {equipmentList.length === 0 ? (
                        <p>등록된 장비가 없습니다. 평면도를 클릭하여 장비를 추가하세요.</p>
                    ) : (
                        <ul className="equipment-list">
                            {equipmentList.map(eq => (
                                <li 
                                    key={eq.id} 
                                    className={`equipment-list-item ${selectedEquipmentId === eq.id ? 'selected' : ''}`}
                                    onClick={() => onSelectEquipment(eq.id)}>
                                    {eq.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

const FloorPlan = ({ building, onAddEquipment, onSelectEquipment, selectedEquipmentId, onFileUpload }: FloorPlanProps) => {
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
    const equipmentList: Equipment[] = building.equipment ? Object.values(building.equipment) : [];

    useEffect(() => {
        if (building.floorPlan) {
            const img = new Image();
            img.onload = () => {
                setImageAspectRatio(img.naturalWidth / img.naturalHeight);
            };
            img.src = building.floorPlan;
        } else {
            setImageAspectRatio(null);
        }
    }, [building.floorPlan]);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onAddEquipment({ x, y });
    };

    return (
        <div className="floor-plan-container">
            {building.floorPlan ? (
                <div 
                    className="floor-plan-image-wrapper" 
                    onClick={handleMapClick}
                    style={{ 
                        aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : 'auto',
                        visibility: imageAspectRatio ? 'visible' : 'hidden' 
                    }}
                >
                    <img src={building.floorPlan} alt={`${building.name} 평면도`} className="floor-plan-image" />
                    {equipmentList.map(eq => (
                        <div
                            key={eq.id}
                            className={`equipment-marker ${selectedEquipmentId === eq.id ? 'selected' : ''}`}
                            style={{ left: `${eq.position.x}%`, top: `${eq.position.y}%` }}
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onSelectEquipment(eq.id);
                            }}
                        ></div>
                    ))}
                </div>
            ) : (
                <div className="floor-plan-uploader">
                    <p>{building.name} 평면도를 업로드하세요.</p>
                    <input type="file" id={`file-upload-${building.id}`} accept="image/*" onChange={onFileUpload} style={{display: 'none'}}/>
                    <label htmlFor={`file-upload-${building.id}`} className="upload-btn">평면도 업로드</label>
                </div>
            )}
        </div>
    );
};

const BuildingView = ({ building, onUpdateBuilding }: BuildingViewProps) => {
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

    useEffect(() => {
        setSelectedEquipmentId(null);
    }, [building.id]);
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateBuilding({ ...building, floorPlan: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddEquipment = (position: { x: number, y: number }) => {
        const newId = `eq_${generateId()}`;
        const newEquipment: Equipment = {
            id: newId,
            name: '새 장비',
            description: '',
            inspectionDate: '',
            issueDate: '',
            position
        };
        const currentEquipment = building.equipment || {};
        onUpdateBuilding({ ...building, equipment: {...currentEquipment, [newId]: newEquipment} });
        setSelectedEquipmentId(newId);
    };

    const handleSaveEquipment = (id: string, data: EquipmentFormData) => {
        const updatedEquipment = { ...building.equipment[id], ...data };
        const newEquipmentData = { ...building.equipment, [id]: updatedEquipment };
        onUpdateBuilding({ ...building, equipment: newEquipmentData });
        alert('장비 정보가 저장되었습니다.');
    };

    const handleDeleteEquipment = (idToDelete: string) => {
        if (window.confirm('이 장비를 정말로 삭제하시겠습니까?')) {
            const equipment = building.equipment || {};
            const { [idToDelete]: _, ...remainingEquipment } = equipment;
            onUpdateBuilding({ ...building, equipment: remainingEquipment });
            setSelectedEquipmentId(null);
        }
    };

    return (
        <div className="building-view">
             <FloorPlan 
                building={building} 
                onAddEquipment={handleAddEquipment} 
                onSelectEquipment={setSelectedEquipmentId}
                selectedEquipmentId={selectedEquipmentId}
                onFileUpload={handleFileUpload}
            />
            <EquipmentPanel
                building={building}
                selectedEquipmentId={selectedEquipmentId}
                onSelectEquipment={setSelectedEquipmentId}
                onClearSelection={() => setSelectedEquipmentId(null)}
                onSave={handleSaveEquipment}
                onDelete={handleDeleteEquipment}
            />
        </div>
    );
};

const App = () => {
    const [buildings, setBuildings] = useState<Building[] | null>(null);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);

    useEffect(() => {
        if (!buildingsRef) {
             console.error("Firebase config is not set. Please update it in index.tsx");
             setBuildings([]); // Show UI with prompt instead of loading forever
             return;
        }

        const listener = buildingsRef.on('value', (snapshot: any) => {
            const data = snapshot.val() as { [key: string]: Building };
            if (data) {
                const buildingsArray: Building[] = Object.values(data);
                setBuildings(buildingsArray);
                
                setActiveTabId(prevActiveTabId => {
                    const currentActiveExists = buildingsArray.some(b => b.id === prevActiveTabId);
                    if ((!prevActiveTabId || !currentActiveExists) && buildingsArray.length > 0) {
                        return buildingsArray[0].id;
                    }
                    if (buildingsArray.length === 0) {
                        return null;
                    }
                    return prevActiveTabId;
                });

            } else {
                const initialBuildings: Building[] = Array.from({ length: 11 }, (_, i) => ({
                    id: String(i + 1),
                    name: `${i + 1}동`,
                    floorPlan: null,
                    equipment: {},
                }));
                 const buildingsObject = initialBuildings.reduce((acc, b) => {
                    acc[b.id] = b;
                    return acc;
                }, {} as { [key: string]: Building });
                buildingsRef.set(buildingsObject);
            }
        });

        return () => {
            if (buildingsRef) {
                buildingsRef.off('value', listener);
            }
        };
    }, []); 

    const addBuilding = () => {
        if (!buildingsRef) {
            alert('Firebase is not configured. Please update firebaseConfig in index.tsx');
            return;
        }
        const newName = prompt('추가할 동의 이름을 입력하세요 (예: 15동):');
        if (newName && buildings && !buildings.find(b => b.name === newName)) {
            const newBuilding: Building = {
                id: generateId(),
                name: newName,
                floorPlan: null,
                equipment: {},
            };
            db.ref(`buildings/${newBuilding.id}`).set(newBuilding);
            setActiveTabId(newBuilding.id);
        } else if (newName) {
            alert('이미 존재하는 동 이름입니다.');
        }
    };

    const deleteBuilding = (idToDelete: string) => {
        if (!db) {
            alert('Firebase is not configured. Please update firebaseConfig in index.tsx');
            return;
        }
        if (confirm('정말로 이 동을 삭제하시겠습니까? 모든 관련 데이터가 사라집니다.')) {
            db.ref(`buildings/${idToDelete}`).remove();
        }
    };

    const handleRenameBuilding = (idToRename: string, newName: string) => {
        if (!db) {
            alert('Firebase is not configured. Please update firebaseConfig in index.tsx');
            return;
        }
        const trimmedName = newName.trim();
        if (!trimmedName) {
            setEditingTabId(null);
            return;
        }

        const isDuplicate = buildings && buildings.some(b => b.id !== idToRename && b.name === trimmedName);
        if (isDuplicate) {
            alert('이미 존재하는 동 이름입니다.');
            return;
        }
        
        db.ref(`buildings/${idToRename}`).update({ name: trimmedName });
        setEditingTabId(null);
    };
    
    const handleUpdateBuilding = useCallback((updatedBuilding: Building) => {
        if (!db) {
            alert('Firebase is not configured. Please update firebaseConfig in index.tsx');
            return;
        }
        const cleanBuilding = { ...updatedBuilding };
        Object.keys(cleanBuilding).forEach(keyStr => {
            const key = keyStr as keyof Building;
            if (cleanBuilding[key] === undefined) {
                delete cleanBuilding[key];
            }
        });
        db.ref(`buildings/${updatedBuilding.id}`).set(cleanBuilding);
    }, []); 

    if (buildings === null) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', width: '100%', fontSize: '1.5rem' }}>
                Loading Real-time Data...
            </div>
        );
    }
    
    const activeBuilding = buildings.find(b => b.id === activeTabId);

    return (
        <>
            <header className="app-header">
                <h1>공장 전산장비 관리 시스템 (공동 작업)</h1>
            </header>
            <div className="tab-container">
                {buildings.map(b => (
                    <div
                        key={b.id}
                        className={`tab ${b.id === activeTabId ? 'active' : ''}`}
                    >
                        {editingTabId === b.id ? (
                            <input
                                type="text"
                                className="tab-edit-input"
                                defaultValue={b.name}
                                onBlur={(e) => handleRenameBuilding(b.id, (e.target as HTMLInputElement).value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleRenameBuilding(b.id, (e.target as HTMLInputElement).value);
                                    } else if (e.key === 'Escape') {
                                        setEditingTabId(null);
                                    }
                                }}
                                autoFocus
                            />
                        ) : (
                            <span 
                                className="tab-name" 
                                onClick={() => setActiveTabId(b.id)}
                                onDoubleClick={() => setEditingTabId(b.id)}
                            >
                                {b.name}
                            </span>
                        )}
                        <button 
                            className="delete-tab-btn" 
                            onClick={() => deleteBuilding(b.id)}
                            aria-label={`${b.name} 탭 삭제`}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button className="add-tab-btn" onClick={addBuilding}>+</button>
            </div>
            <main className="main-content">
                {activeBuilding ? (
                   <BuildingView building={activeBuilding} onUpdateBuilding={handleUpdateBuilding} />
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', width: '100%' }}>
                        <h2>관리할 동을 선택하거나 추가해주세요.</h2>
                        {firebaseConfig.apiKey === "YOUR_API_KEY" && <p style={{color: 'red'}}>Firebase 설정이 필요합니다. index.tsx 파일을 수정해주세요.</p>}
                    </div>
                )}
            </main>
        </>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}