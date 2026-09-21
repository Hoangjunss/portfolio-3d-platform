"use client";

import React, { Suspense, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Template } from "@/lib/apiClient";
import { shouldRenderTexture } from "@/lib/templateTexture";

interface TextureErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface TextureErrorBoundaryState {
  hasError: boolean;
}

class TextureErrorBoundary extends React.Component<
  TextureErrorBoundaryProps,
  TextureErrorBoundaryState
> {
  constructor(props: TextureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): TextureErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function TextureMaterial({ url }: { url: string }) {
  const texture = useTexture(url);
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

// WebGL materials can't read CSS custom properties, so these mirror the
// tokens.css Atelier-warm palette as literal hex: --color-paper-2 and --color-accent.
const MESH_FALLBACK_COLOR = "#efe8e0";

function FallbackCardMaterial({ template }: { template: Template }) {
  return (
    <>
      <meshBasicMaterial color={MESH_FALLBACK_COLOR} />
      <Html
        center
        distanceFactor={6}
        className="pointer-events-none select-none text-center p-3 w-48"
      >
        <div
          className="rounded-[var(--radius-sm)] p-3 border shadow-lg backdrop-blur-sm"
          style={{ backgroundColor: "var(--color-paper-2)", borderColor: "var(--color-rule)" }}
        >
          <p
            className="text-[10px] uppercase font-semibold tracking-wider mb-1"
            style={{ fontFamily: "var(--font-wordmark)", color: "var(--color-accent)" }}
          >
            {template.category || "Template"}
          </p>
          <p
            className="text-xs font-semibold truncate"
            style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}
          >
            {template.name}
          </p>
        </div>
      </Html>
    </>
  );
}

interface CardMeshProps {
  template: Template;
  index: number;
  total: number;
  rotationOffset: number;
  onSelect: (template: Template) => void;
}

function CardMesh({
  template,
  index,
  total,
  rotationOffset,
  onSelect,
}: CardMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Distribute cards in an arc along the circle
  const angleStep = (2 * Math.PI) / Math.max(total, 1);
  const baseAngle = index * angleStep;
  const currentAngle = baseAngle + rotationOffset;

  // Normalized angle between -PI and PI to determine distance from front focus
  const normalizedAngle =
    Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle));
  const isFocused = Math.abs(normalizedAngle) < angleStep * 0.6;

  const radius = 4.2;
  const targetX = Math.sin(currentAngle) * radius;
  const targetZ = Math.cos(currentAngle) * radius - radius;
  const targetScale = isFocused ? 1.15 : hovered ? 1.05 : 0.95;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const step = Math.min(delta * 8, 1);
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetX,
      step
    );
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      targetZ,
      step
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      -currentAngle,
      step
    );
    const scale = THREE.MathUtils.lerp(
      meshRef.current.scale.x,
      targetScale,
      step
    );
    meshRef.current.scale.set(scale, scale, 1);
  });

  return (
    <mesh
      ref={meshRef}
      position={[targetX, 0, targetZ]}
      rotation={[0, -currentAngle, 0]}
      scale={[targetScale, targetScale, 1]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(template);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[3.2, 2.0]} />
      {/* Decision (i): Null thumbnailUrl renders coloured plane without calling useTexture.
          URLs are wrapped in Suspense and ErrorBoundary to prevent 404 from blanking carousel. */}
      {shouldRenderTexture(template.thumbnailUrl) ? (
        <TextureErrorBoundary
          fallback={<FallbackCardMaterial template={template} />}
        >
          <Suspense fallback={<meshBasicMaterial color="#d8cfc2" />}>
            <TextureMaterial url={template.thumbnailUrl} />
          </Suspense>
        </TextureErrorBoundary>
      ) : (
        <FallbackCardMaterial template={template} />
      )}
    </mesh>
  );
}

export interface TemplateCarousel3DProps {
  templates: Template[];
  onSelect: (template: Template) => void;
}

export function TemplateCarousel3D({
  templates,
  onSelect,
}: TemplateCarousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const dragRef = useRef({ isDragging: false, startX: 0, startRotation: 0 });

  const total = templates.length;
  const angleStep = useMemo(
    () => (2 * Math.PI) / Math.max(total, 1),
    [total]
  );

  const rotateTo = (index: number) => {
    const safeIndex = ((index % total) + total) % total;
    setActiveIndex(safeIndex);
    setTargetRotation(-safeIndex * angleStep);
  };

  const handlePrev = () => rotateTo(activeIndex - 1);
  const handleNext = () => rotateTo(activeIndex + 1);

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full h-[520px] max-w-6xl mx-auto my-4 select-none"
      onPointerDown={(e) => {
        dragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startRotation: targetRotation,
        };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.isDragging) return;
        const deltaX = e.clientX - dragRef.current.startX;
        const newRotation = dragRef.current.startRotation + deltaX * 0.005;
        setTargetRotation(newRotation);
      }}
      onPointerUp={() => {
        if (!dragRef.current.isDragging) return;
        dragRef.current.isDragging = false;
        // Snap to nearest card
        const nearestIndex = Math.round(-targetRotation / angleStep);
        rotateTo(nearestIndex);
      }}
      onPointerLeave={() => {
        if (dragRef.current.isDragging) {
          dragRef.current.isDragging = false;
          const nearestIndex = Math.round(-targetRotation / angleStep);
          rotateTo(nearestIndex);
        }
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={1.5} />
        <group position={[0, 0, 0]}>
          {templates.map((template, idx) => (
            <CardMesh
              key={template.id}
              template={template}
              index={idx}
              total={total}
              rotationOffset={targetRotation}
              onSelect={onSelect}
            />
          ))}
        </group>
      </Canvas>

      {/* Navigation overlay controls */}
      {total > 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 sm:px-8">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Thẻ 3D trước"
            className="pointer-events-auto p-3 rounded-full border border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper-2)]/80 text-[var(--color-ink)] shadow-xl transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] backdrop-blur-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Thẻ 3D tiếp theo"
            className="pointer-events-auto p-3 rounded-full border border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper-2)]/80 text-[var(--color-ink)] shadow-xl transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] backdrop-blur-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Active template indicator */}
      {templates[activeIndex] && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center">
          <p
            className="text-sm font-semibold drop-shadow"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            {templates[activeIndex].name}
          </p>
          <p
            className="text-xs drop-shadow"
            style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}
          >
            Nhấn để xem trước &middot; Kéo hoặc dùng mũi tên để xoay
          </p>
        </div>
      )}
    </div>
  );
}
