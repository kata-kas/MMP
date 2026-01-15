import { Suspense, useContext, useRef, useState, useEffect, useLayoutEffect } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Center, GizmoHelper, GizmoViewport, Html, OrbitControls, useProgress } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import type { BufferGeometry, Group } from "three";
import { Box3, Vector3 } from "three";
import type { Asset } from "@/assets/entities/Assets";
import { SettingsContext } from "@/core/settings/settingsContext";

interface AssetModelViewerProps {
    asset: Asset;
}

function AssetModel({ asset }: { asset: Asset }) {
    const { settings, ready } = useContext(SettingsContext);
    const baseUrl =
        ready && settings?.localBackend && settings.localBackend !== ""
            ? settings.localBackend
            : "/api";
    const modelUrl = `${baseUrl}/assets/${asset.id}/file`;

    const geom = useLoader(STLLoader as any, modelUrl) as BufferGeometry;

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={0.1}>
            <primitive object={geom} attach="geometry" />
            <meshStandardMaterial color="#4C5897" />
        </mesh>
    );
}

function MoveCamera({ children }: { children: JSX.Element }) {
    const group = useRef<Group>(null);
    const { camera } = useThree();

    useLayoutEffect(() => {
        if (!group.current) return;
        const box = new Box3();
        box.setFromObject(group.current);

        const size = new Vector3();
        box.getSize(size);
        const cam = camera as any;
        if (!cam.fov || !cam.aspect) return;

        const fov = cam.fov * (Math.PI / 180);
        const fovh = 2 * Math.atan(Math.tan(fov / 2) * cam.aspect);
        const dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
        const dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
        let cameraZ = Math.max(dx, dy);

        cameraZ *= 1.25;

        camera.position.set(0, 0, cameraZ);

        const newX = camera.position.x - size.x / 2;
        const newY = camera.position.y - size.y / 2;
        group.current.position.set(newX, newY, group.current.position.z);

        const minZ = box.min.z;
        const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

        cam.far = cameraToFarEdge * 3;
        cam.updateProjectionMatrix();
    }, [camera]);

    return <group ref={group as any}>{children}</group>;
}

function Progress() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="text-white">Loading {progress}%</div>
        </Html>
    );
}

export function AssetModelViewer({ asset }: AssetModelViewerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(800);

    useEffect(() => {
        if (!ref.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(ref.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const height = width * (9 / 16);

    return (
        <div ref={ref} className="w-full h-full">
            <div className="relative bg-muted rounded-lg" style={{ height }}>
                <Canvas
                    shadows
                    camera={{ position: [0, 0, 0], fov: 20 }}
                    style={{ height: height - 20 }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        castShadow
                        position={[2.5, 5, 5]}
                        intensity={1.5}
                        shadow-mapSize={[1024, 1024]}
                    >
                        <orthographicCamera
                            attach="shadow-camera"
                            args={[-5, 5, 5, -5, 1, 50]}
                        />
                    </directionalLight>
                    <Center>
                        <Suspense fallback={<Progress />}>
                            <MoveCamera>
                                <AssetModel asset={asset} />
                            </MoveCamera>
                        </Suspense>
                    </Center>
                    <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                        <GizmoViewport labelColor="white" axisHeadScale={1} />
                    </GizmoHelper>
                    <OrbitControls makeDefault />
                </Canvas>
            </div>
        </div>
    );
}
