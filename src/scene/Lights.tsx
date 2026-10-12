export function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#30343f', 1.1]} />
      <directionalLight position={[5, 8, 6]} intensity={1.6} />
      <directionalLight position={[-6, 2, -4]} intensity={0.5} color="#b8c4ff" />
      <directionalLight position={[0, -6, 3]} intensity={0.25} />
    </>
  )
}
