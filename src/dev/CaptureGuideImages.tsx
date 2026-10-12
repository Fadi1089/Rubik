/**
 * Dev-only page that renders every guide picture with the Classic cube and saves it to
 * public/guide-images through the dev server. Open the dev server with ?capture-guide-images.
 */
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Matrix4, Quaternion } from 'three'
import {
  allGuideImages,
  greyStickers,
  imageState,
  type ImageSpec,
  type ImageView,
} from '../guides/images'
import { SPACING } from '../scene/constants'
import { Cubie } from '../scene/Cubie'

const SIZE = 320
interface View {
  position: [number, number, number]
  fov: number
  /** Screen-up direction; the overhead view puts the front face at the bottom. */
  up?: [number, number, number]
}

const VIEWS: Record<ImageView, View> = {
  // Steeply from above: the top face plus the front and right sides, which is enough to
  // recognise every last-layer case (two-sided recognition).
  top: { position: [3.2, 9.2, 4.7], fov: 30 },
  iso: { position: [5.4, 4.6, 6.6], fov: 30 },
  low: { position: [5.4, -4.6, 6.6], fov: 30 },
  left: { position: [-5.4, 4.6, 6.6], fov: 30 },
}

function quaternionOf(m: readonly number[]): Quaternion {
  const matrix = new Matrix4().set(
    m[0],
    m[1],
    m[2],
    0,
    m[3],
    m[4],
    m[5],
    0,
    m[6],
    m[7],
    m[8],
    0,
    0,
    0,
    0,
    1,
  )
  return new Quaternion().setFromRotationMatrix(matrix)
}

function StaticCube({ spec }: { spec: ImageSpec }) {
  return (
    <>
      {imageState(spec).map((cubie) => (
        <group
          key={cubie.id}
          position={cubie.position.map((c) => c * SPACING) as [number, number, number]}
          quaternion={quaternionOf(cubie.orientation)}
        >
          <Cubie home={cubie.home} styleId="classic" grey={greyStickers(spec.mask, cubie)} />
        </group>
      ))}
    </>
  )
}

/** Renders the current picture by hand (no animation loop needed) and uploads it. */
function Shooter({ spec, onDone }: { spec: ImageSpec; onDone: () => void }) {
  const get = useThree((state) => state.get)
  useEffect(() => {
    const { gl, scene, camera } = get()
    const view = VIEWS[spec.view]
    camera.position.set(...view.position)
    camera.up.set(...(view.up ?? [0, 1, 0]))
    camera.lookAt(0, 0, 0)
    if ('fov' in camera) {
      camera.fov = view.fov
      camera.updateProjectionMatrix()
    }
    camera.updateMatrixWorld()
    gl.render(scene, camera)
    gl.domElement.toBlob(
      (blob) => {
        if (!blob) return
        void fetch(`/__guide-images?name=${spec.id}`, { method: 'POST', body: blob }).then(onDone)
      },
      'image/webp',
      0.9,
    )
  }, [spec, get, onDone])
  return null
}

export function CaptureGuideImages() {
  const specs = allGuideImages()
  const [index, setIndex] = useState(0)
  const spec = specs[index]

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#333', background: '#eee' }}>
      <p id="capture-status">
        {spec
          ? `Rendering ${index + 1} / ${specs.length}: ${spec.id}`
          : `Done: ${specs.length} images`}
      </p>
      <div style={{ width: SIZE, height: SIZE }}>
        <Canvas
          frameloop="never"
          dpr={2}
          gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
          camera={{ fov: 30, position: VIEWS.iso.position }}
        >
          <hemisphereLight args={['#ffffff', '#d8d2c8', 1.5]} />
          <directionalLight position={[5, 8, 6]} intensity={1.5} />
          <directionalLight position={[-6, 3, -4]} intensity={0.5} />
          <directionalLight position={[2, -8, 4]} intensity={1.3} />
          {spec && (
            <>
              <StaticCube spec={spec} />
              <Shooter key={spec.id} spec={spec} onDone={() => setIndex((i) => i + 1)} />
            </>
          )}
        </Canvas>
      </div>
    </div>
  )
}
