'use client'

import { useEffect, useRef } from 'react'

export function AnimatedBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const canvasEl = canvas as HTMLCanvasElement
    const ctx2d = ctx as CanvasRenderingContext2D

    canvasEl.width = window.innerWidth
    canvasEl.height = window.innerHeight

    // Particle system
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number

      constructor() {
        this.x = Math.random() * canvasEl.width
        this.y = Math.random() * canvasEl.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = Math.random() * 0.5 - 0.25
        this.speedY = Math.random() * 0.5 - 0.25
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update(): void {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvasEl.width) this.x = 0
        if (this.x < 0) this.x = canvasEl.width
        if (this.y > canvasEl.height) this.y = 0
        if (this.y < 0) this.y = canvasEl.height
      }

      draw(): void {
        ctx2d.fillStyle = `rgba(255, 120, 0, ${this.opacity})`
        ctx2d.beginPath()
        ctx2d.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx2d.fill()
      }
    }

    // Blockchain link
    class BlockchainLink {
      x: number
      y: number
      size: number
      angle: number
      speed: number
      opacity: number

      constructor() {
        this.x = Math.random() * canvasEl.width
        this.y = Math.random() * canvasEl.height
        this.size = Math.random() * 30 + 20
        this.angle = Math.random() * Math.PI * 2
        this.speed = Math.random() * 0.002 + 0.001
        this.opacity = Math.random() * 0.1 + 0.05
      }

      update(): void {
        this.angle += this.speed
        this.x += Math.cos(this.angle) * 0.5
        this.y += Math.sin(this.angle) * 0.5

        if (this.x > canvasEl.width + 50) this.x = -50
        if (this.x < -50) this.x = canvasEl.width + 50
        if (this.y > canvasEl.height + 50) this.y = -50
        if (this.y < -50) this.y = canvasEl.height + 50
      }

      draw(): void {
        ctx2d.strokeStyle = `rgba(147, 51, 234, ${this.opacity})`
        ctx2d.lineWidth = 2
        ctx2d.beginPath()
        ctx2d.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx2d.stroke()

        // Draw chain link
        ctx2d.fillStyle = `rgba(147, 51, 234, ${this.opacity * 0.5})`
        ctx2d.font = `${this.size * 0.6}px Arial`
        ctx2d.textAlign = 'center'
        ctx2d.textBaseline = 'middle'
        ctx2d.fillText('⛓', this.x, this.y)
      }
    }

    const particles: Particle[] = []
    const blockchainLinks: BlockchainLink[] = []

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle())
    }

    // Create blockchain links
    for (let i = 0; i < 8; i++) {
      blockchainLinks.push(new BlockchainLink())
    }

    // Animation loop
    function animate(): void {
      if (!ctx2d || !canvasEl) return
      
      ctx2d.clearRect(0, 0, canvasEl.width, canvasEl.height)

      // Draw connections between nearby particles
      particles.forEach((particle, index) => {
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx2d.strokeStyle = `rgba(255, 120, 0, ${0.1 * (1 - distance / 100)})`
            ctx2d.lineWidth = 0.5
            ctx2d.beginPath()
            ctx2d.moveTo(particle.x, particle.y)
            ctx2d.lineTo(otherParticle.x, otherParticle.y)
            ctx2d.stroke()
          }
        })
      })

      // Update and draw blockchain links
      blockchainLinks.forEach(link => {
        link.update()
        link.draw()
      })

      // Update and draw particles
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = (): void => {
      canvasEl.width = window.innerWidth
      canvasEl.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  )
}
