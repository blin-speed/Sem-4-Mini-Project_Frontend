import { motion } from 'framer-motion'

const GlobalBackgroundAnimation = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      pointerEvents: 'none',
      overflow: 'hidden',
      backgroundColor: '#fff'
    }}>
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.15,
          filter: 'grayscale(1) brightness(1.2)'
        }}
      >
        <source src="/make_animation_of_matrix_3x3_matric_that_matrix_in (1).mp4" type="video/mp4" />
      </video>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
        pointerEvents: 'none'
      }} />
    </div>
  )
}

export default GlobalBackgroundAnimation
