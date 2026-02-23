import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Circle, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Member, TreeConfig } from '../types';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';

interface FamilyTreeProps {
  members: Member[];
  config: TreeConfig;
  onMemberClick: (member: Member) => void;
  onConfigUpdate?: (newConfig: Partial<TreeConfig>) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 140;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 120;
const SPOUSE_GAP = 10;

const MALE_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M50 22c-7 0-13 6-13 13s6 13 13 13 13-6 13-13-6-13-13-13zM25 78c0-12 10-22 25-22s25 10 25 22v4H25v-4z' fill='%239ca3af'/%3E%3C/svg%3E";
const FEMALE_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M50 20c-8 0-15 7-15 15 0 4 2 8 5 11-6 3-10 9-11 16-.5 3 2 6 5 6h32c3 0 5.5-3 5-6-1-7-5-13-11-16 3-3 5-7 5-11 0-8-7-15-15-15z' fill='%239ca3af'/%3E%3Cpath d='M35 35c0 10 5 20 15 20s15-10 15-20-5-15-15-15-15 5-15 15z' fill='%239ca3af'/%3E%3Cpath d='M32 35c0 15 5 25 18 25s18-10 18-25-5-20-18-20-18 5-18 20z' fill='%239ca3af'/%3E%3C/svg%3E";

const MemberNode = ({ member, x, y, onClick }: { member: Member; x: number; y: number; onClick: () => void }) => {
  const [image] = useImage(member.photo_url || (member.gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR));
  const isDead = !!member.death_date;
  const mainColor = isDead ? '#6b7280' : '#16a34a';
  
  const getYear = (dateStr?: string) => {
    if (!dateStr) return '';
    const match = dateStr.match(/\d{4}/);
    return match ? match[0] : '';
  };

  const birthYear = getYear(member.birth_date) || '?';
  const deathYear = getYear(member.death_date);
  const yearsText = deathYear ? `${birthYear} - ${deathYear}` : `${birthYear}`;
  
  // Location text: burial place if dead, address if alive
  const locationText = isDead 
    ? (member.burial_place || '')
    : (member.address || '');

  return (
    <Group x={x} y={y} onClick={onClick} onTap={onClick} cursor="pointer">
      <Rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        fill="white"
        cornerRadius={20}
        shadowBlur={12}
        shadowColor="rgba(0,0,0,0.15)"
        stroke={mainColor}
        strokeWidth={3}
      />
      <Group x={NODE_WIDTH / 2} y={0}>
        <Circle radius={40} fill="white" stroke={mainColor} strokeWidth={3} />
        <Group clipFunc={(ctx) => ctx.arc(0, 0, 38, 0, Math.PI * 2)}>
          {image && <KonvaImage image={image} x={-38} y={-38} width={76} height={76} />}
        </Group>
      </Group>
      <Text
        text={member.name}
        fontSize={15}
        fontStyle="bold"
        fontFamily="Inter"
        fill="#111827"
        align="center"
        width={NODE_WIDTH - 20}
        x={10}
        y={50}
      />
      <Text
        text={yearsText}
        fontSize={12}
        fontFamily="Inter"
        fill="#4b5563"
        align="center"
        width={NODE_WIDTH - 20}
        x={10}
        y={72}
      />
      <Text
        text={locationText}
        fontSize={10}
        fontFamily="Inter"
        fill="#6b7280"
        align="center"
        width={NODE_WIDTH - 30}
        x={15}
        y={90}
        wrap="word"
        height={30}
      />
      <Rect
        x={NODE_WIDTH / 2 - 35}
        y={NODE_HEIGHT - 18}
        width={70}
        height={18}
        fill={mainColor}
        cornerRadius={9}
      />
      <Text
        text={isDead ? 'Đã mất' : 'Còn sống'}
        fontSize={10}
        fontStyle="bold"
        fontFamily="Inter"
        fill="white"
        align="center"
        width={70}
        x={NODE_WIDTH / 2 - 35}
        y={NODE_HEIGHT - 14}
      />
    </Group>
  );
};

export default function FamilyTree({ members, config, onMemberClick, onConfigUpdate }: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [bgImage] = useImage(config.background_url || '');
  const [overlayImage] = useImage(config.overlay_url || '');
  const stageRef = useRef<any>(null);
  const treeGroupRef = useRef<any>(null);
  const hasAutoFitted = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    hasAutoFitted.current = false;
  }, [members.length]);

  const treeData = useMemo(() => {
    const generations: { [key: number]: Member[] } = {};
    members.forEach(m => {
      if (!generations[m.generation]) generations[m.generation] = [];
      generations[m.generation].push(m);
    });

    const positions: { [key: number]: { x: number; y: number } } = {};
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    Object.keys(generations).sort((a, b) => parseInt(a) - parseInt(b)).forEach(genStr => {
      const gen = parseInt(genStr);
      const genMembers = generations[gen];
      const processed = new Set<number>();
      const ordered: Member[] = [];

      // 1. Identify and sort descendants (those with father_id or roots)
      const descendants = [...genMembers].filter(m => 
        (m.father_id != null) || !genMembers.some(s => s.id === m.spouse_id)
      ).sort((a, b) => {
        if (a.father_id !== b.father_id) return (Number(a.father_id) || 0) - (Number(b.father_id) || 0);
        return (a.child_order || 0) - (b.child_order || 0);
      });

      descendants.forEach(m => {
        if (processed.has(m.id)) return;
        ordered.push(m);
        processed.add(m.id);

        // Find all spouses of this member in the same generation
        const spouses = genMembers.filter(s => 
          (s.spouse_id === m.id || m.spouse_id === s.id) && !processed.has(s.id)
        ).sort((a, b) => (a.spouse_order || 0) - (b.spouse_order || 0));

        spouses.forEach(s => {
          ordered.push(s);
          processed.add(s.id);
        });
      });

      // 2. Add any remaining members (e.g. disconnected members or spouses of spouses)
      genMembers.forEach(m => {
        if (!processed.has(m.id)) {
          ordered.push(m);
          processed.add(m.id);
        }
      });

      let currentX = 0;
      const genY = 250 + (gen - 1) * (NODE_HEIGHT + VERTICAL_GAP);

      ordered.forEach((m, idx) => {
        const isSpousePair = m.spouse_id && idx > 0 && ordered[idx - 1]?.id === m.spouse_id;
        
        if (isSpousePair) {
          currentX += SPOUSE_GAP;
        } else if (idx > 0) {
          currentX += HORIZONTAL_GAP;
        }
        
        positions[m.id] = { x: currentX, y: genY };
        currentX += NODE_WIDTH;

        minX = Math.min(minX, positions[m.id].x);
        maxX = Math.max(maxX, positions[m.id].x + NODE_WIDTH);
        minY = Math.min(minY, positions[m.id].y);
        maxY = Math.max(maxY, positions[m.id].y + NODE_HEIGHT);
      });

      const genWidth = currentX;
      const offset = -genWidth / 2;
      ordered.forEach(m => {
        positions[m.id].x += offset;
      });
    });

    return { positions, bounds: { minX, maxX, minY, maxY } };
  }, [members]);

  const autoFit = () => {
    if (members.length > 0 && treeGroupRef.current) {
      const group = treeGroupRef.current;
      const { minX, maxX, minY, maxY } = treeData.bounds;
      if (minX === Infinity) return;

      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;
      const padding = 120;
      const scaleX = (dimensions.width - padding * 2) / treeWidth;
      const scaleY = (dimensions.height - padding * 2) / treeHeight;
      const newScale = Math.min(scaleX, scaleY, 1);

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const treeCenterX = (minX + maxX) / 2;
      const treeCenterY = (minY + maxY) / 2;

      onConfigUpdate?.({
        tree_scale: newScale,
        tree_x: centerX - treeCenterX * newScale,
        tree_y: centerY - treeCenterY * newScale
      });
    }
  };

  useEffect(() => {
    if (!hasAutoFitted.current && dimensions.width > 0 && !config.tree_x && !config.tree_y) {
      autoFit();
      hasAutoFitted.current = true;
    }
  }, [members, treeData, dimensions]);

  const handleZoom = (factor: number) => {
    const oldScale = config.tree_scale || 1;
    const newScale = oldScale * factor;
    
    const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
    const pointTo = {
      x: (center.x - (config.tree_x || 0)) / oldScale,
      y: (center.y - (config.tree_y || 0)) / oldScale,
    };

    onConfigUpdate?.({
      tree_scale: newScale,
      tree_x: center.x - pointTo.x * newScale,
      tree_y: center.y - pointTo.y * newScale,
    });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = config.tree_scale || 1;
    const pointer = stageRef.current.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - (config.tree_x || 0)) / oldScale,
      y: (pointer.y - (config.tree_y || 0)) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    onConfigUpdate?.({
      tree_scale: newScale,
      tree_x: pointer.x - mousePointTo.x * newScale,
      tree_y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const connections = useMemo(() => {
    const lines: any[] = [];
    members.forEach(m => {
      const mPos = treeData.positions[m.id];
      if (!mPos) return;
      if (m.father_id && treeData.positions[m.father_id]) {
        const fatherPos = treeData.positions[m.father_id];
        const midY = fatherPos.y + NODE_HEIGHT + VERTICAL_GAP / 2;
        lines.push({
          points: [
            fatherPos.x + NODE_WIDTH / 2, fatherPos.y + NODE_HEIGHT,
            fatherPos.x + NODE_WIDTH / 2, midY,
            mPos.x + NODE_WIDTH / 2, midY,
            mPos.x + NODE_WIDTH / 2, mPos.y
          ]
        });
      }
      if (m.spouse_id && treeData.positions[m.spouse_id]) {
        const spousePos = treeData.positions[m.spouse_id];
        if (m.id < m.spouse_id) {
          lines.push({
            points: [mPos.x + NODE_WIDTH, mPos.y + NODE_HEIGHT / 2, spousePos.x, spousePos.y + NODE_HEIGHT / 2],
            isSpouse: true
          });
        }
      }
    });
    return lines;
  }, [members, treeData]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#f5f5f0] overflow-hidden cursor-grab active:cursor-grabbing relative">
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur p-2 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-1">
          <button onClick={() => handleZoom(1.2)} className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-olive" title="Phóng to">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-olive" title="Thu nhỏ">
            <ZoomOut size={20} />
          </button>
          <button onClick={autoFit} className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-olive" title="Vừa khung hình">
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {dimensions.width > 0 && (
        <Stage ref={stageRef} width={dimensions.width} height={dimensions.height} onWheel={handleWheel}>
          <Layer listening={false}>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                width={dimensions.width}
                height={dimensions.height}
                x={0}
                y={0}
              />
            )}
          </Layer>

          <Layer>
            {/* Overlay Image - Independent */}
            {overlayImage && (
              <KonvaImage
                image={overlayImage}
                x={config.overlay_x ?? 0}
                y={config.overlay_y ?? 0}
                scaleX={config.overlay_scale ?? 1}
                scaleY={config.overlay_scale ?? 1}
                draggable
                onDragEnd={(e) => {
                  onConfigUpdate?.({
                    overlay_x: e.target.x(),
                    overlay_y: e.target.y()
                  });
                }}
              />
            )}

            {/* Tree Title - Independent */}
            <Group
              x={config.title_x ?? dimensions.width / 2}
              y={config.title_y ?? 80}
              draggable
              onDragEnd={(e) => onConfigUpdate?.({ title_x: e.target.x(), title_y: e.target.y() })}
            >
              {config.title_lines ? (
                (() => {
                  try {
                    const lines = JSON.parse(config.title_lines);
                    let currentY = 0;
                    return lines.map((line: any, idx: number) => {
                      const node = (
                        <Text
                          key={idx}
                          text={line.text}
                          fontSize={line.fontSize || config.title_font_size || 48}
                          fontFamily={config.title_font_family || 'Cormorant Garamond'}
                          fontStyle="bold italic"
                          fill="#5A5A40"
                          align="center"
                          width={800}
                          offsetX={400}
                          y={currentY}
                        />
                      );
                      currentY += (line.fontSize || config.title_font_size || 48) * 1.2;
                      return node;
                    });
                  } catch (e) {
                    return (
                      <Text
                        text={config.title}
                        fontSize={config.title_font_size ?? 48}
                        fontFamily={config.title_font_family ?? 'Cormorant Garamond'}
                        fontStyle="bold italic"
                        fill="#5A5A40"
                        align="center"
                        width={800}
                        offsetX={400}
                      />
                    );
                  }
                })()
              ) : (
                <Text
                  text={config.title}
                  fontSize={config.title_font_size ?? 48}
                  fontFamily={config.title_font_family ?? 'Cormorant Garamond'}
                  fontStyle="bold italic"
                  fill="#5A5A40"
                  align="center"
                  width={800}
                  offsetX={400}
                />
              )}
            </Group>

            {/* Tree Group - Independent */}
            <Group 
              ref={treeGroupRef} 
              draggable 
              x={config.tree_x ?? 0}
              y={config.tree_y ?? 0}
              scaleX={config.tree_scale ?? 1}
              scaleY={config.tree_scale ?? 1}
              onDragEnd={(e) => {
                onConfigUpdate?.({
                  tree_x: e.target.x(),
                  tree_y: e.target.y()
                });
              }}
            >
              {connections.map((conn, i) => (
                <Line
                  key={i}
                  points={conn.points}
                  stroke={conn.isSpouse ? "#F27D26" : "#5A5A40"}
                  strokeWidth={3}
                  dash={conn.isSpouse ? [6, 6] : []}
                  lineJoin="round"
                  lineCap="round"
                />
              ))}
              {members.map(member => {
                const pos = treeData.positions[member.id];
                return pos ? <MemberNode key={member.id} member={member} x={pos.x} y={pos.y} onClick={() => onMemberClick(member)} /> : null;
              })}
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
}


