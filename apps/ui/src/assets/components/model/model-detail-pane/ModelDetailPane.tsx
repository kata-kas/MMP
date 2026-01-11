import { BufferGeometry, Mesh, Group, Box3, Vector3, Box3Helper, AxesHelper } from 'three'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { Suspense, useContext, useLayoutEffect, useRef, useEffect, useState } from "react";
import { Asset } from "../../../entities/Assets.ts";
import { Center, GizmoHelper, GizmoViewport, Html, OrbitControls, useProgress } from '@react-three/drei'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SettingsContext } from '@/core/settings/settingsContext.ts';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModelProps = {
    color: string,
    model: Asset,
    projectUuid: string
}

function Model({ color, model, projectUuid }: ModelProps) {
    const { settings, ready } = useContext(SettingsContext);
    const baseUrl = (ready && settings?.localBackend && settings.localBackend !== '') 
        ? settings.localBackend 
        : '/api';
    const modelUrl = `${baseUrl}/projects/${projectUuid}/assets/${model.id}/file`;
    
    const geom = useLoader(STLLoader, modelUrl) as BufferGeometry;
    const meshRef = useRef<Mesh>(null!)

    const [active, setActive] = useState(false)

    return (
        <>
            <mesh
                name={model.id}
                onClick={() => setActive(!active)}
                ref={meshRef}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.1}>
                <primitive object={geom} attach="geometry" />
                <meshStandardMaterial color={color} />
            </mesh>
        </>
    )
}

type SceneProps = {
    models: Asset[],
    projectUuid: string
}

function Scene({ models, projectUuid }: SceneProps) {
    const colors = ["#9d4b4b", "#4C5897", "#5474B4", "#504C97", "#6B31B2", "#C91A52"]
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight castShadow position={[2.5, 5, 5]} intensity={1.5} shadow-mapSize={[1024, 1024]}>
                <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 1, 50]} />
            </directionalLight>
            <Center>
                <Suspense fallback={<Progress />}>
                    <MoveCamera models={models}>
                        {models.map((model, i) => (
                            <Model key={model.id} color={colors[i % colors.length]} model={model} projectUuid={projectUuid} />
                        ))}
                    </MoveCamera>
                </Suspense>
            </Center>
            <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
                <GizmoViewport labelColor="white" axisHeadScale={1} />
            </GizmoHelper>
            <OrbitControls makeDefault />
        </>
    )
}

function MoveCamera({ children, models }: { children: JSX.Element[], models: Asset[] }) {
    const group = useRef<Group>(null)
    const { camera } = useThree()
    useLayoutEffect(() => {
        if (!group.current) return;
        const box = new Box3();
        box.setFromObject(group.current);

        const size = new Vector3();
        box.getSize(size);
        const fov = camera.fov * (Math.PI / 180);
        const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
        const dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
        const dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
        let cameraZ = Math.max(dx, dy);

        cameraZ *= 1.25;

        camera.position.set(0, 0, cameraZ);

        const newX = camera.position.x - (size.x / 2);
        const newY = camera.position.y - (size.y / 2);
        group.current.position.set(newX, newY, group.current.position.z)

        const minZ = box.min.z;
        const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

        const box3Helper = new Box3Helper(box, 0x00ff00);
        box3Helper.material.linewidth = 3;
        group.current.add(box3Helper);

        const axesHelper = new AxesHelper(5);
        const center = new Vector3();
        box.getCenter(center)
        axesHelper.position.set(center.x, center.y, center.z)
        group.current.add(axesHelper);

        camera.far = cameraToFarEdge * 3;
        camera.updateProjectionMatrix();
        const currentGroup = group.current;
        return () => {
            if (currentGroup) {
                currentGroup.remove(box3Helper);
                currentGroup.remove(axesHelper);
            }
        }
    }, [models, camera]);
    return (
        <group ref={group}>
            {children}
        </group>
    );
}

function Progress() {
    const { progress, loaded } = useProgress()
    return <Html center>{progress} % loaded {loaded}</Html>
}

type ModelDetailPaneProps = {
    models: Asset[],
    projectUuid: string
    onClose: () => void;
}

export function ModelDetailPane({ models, projectUuid, onClose }: ModelDetailPaneProps) {
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
        <div ref={ref} className="w-full">
            <Alert className="relative" style={{ height }}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
                <AlertTitle className="sr-only">3D Model</AlertTitle>
                <AlertDescription className="p-0">
                    <Canvas shadows raycaster={{ params: { Line: { threshold: 0.15 } } }}
                        camera={{ position: [0, 0, 0], fov: 20 }}
                        style={{ height: height - 20 }}
                    >
                        <Scene models={models} projectUuid={projectUuid} />
                    </Canvas>
                </AlertDescription>
            </Alert>
        </div>
    );
}

