import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Landing.css'

const FONT_LINKS = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap' },
]

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'

export default function Landing() {
  const navigate = useNavigate()
  const starsRef = useRef(null)
  const navRef = useRef(null)
  const heroRef = useRef(null)
  const earthRef = useRef(null)

  const scrollToSection = (id) => {
    const target = document.getElementById(id)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const head = document.head
    const addedLinks = FONT_LINKS.map((linkConfig) => {
      if (document.querySelector(`link[href="${linkConfig.href}"]`)) return null
      const linkEl = document.createElement('link')
      linkEl.rel = linkConfig.rel
      linkEl.href = linkConfig.href
      if (linkConfig.crossOrigin) linkEl.crossOrigin = linkConfig.crossOrigin
      head.appendChild(linkEl)
      return linkEl
    })

    let threeScript
    let isCancelled = false
    const cleanupFns = []

    const addBackgroundStars = () => {
      const container = starsRef.current
      if (!container) return
      const created = []
      const extraStars = 300
      for (let i = 0; i < extraStars; i += 1) {
        const star = document.createElement('span')
        star.style.left = `${Math.random() * 100}%`
        star.style.top = `${Math.random() * 100}%`
        star.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`
        star.style.opacity = `${(0.2 + Math.random() * 0.8).toFixed(2)}`
        container.appendChild(star)
        created.push(star)
      }
      cleanupFns.push(() => {
        created.forEach((star) => {
          if (star.parentNode) star.parentNode.removeChild(star)
        })
      })
    }

    const setupNavObserver = () => {
      const nav = navRef.current
      const hero = heroRef.current
      if (!nav || !hero) return
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < 1) nav.classList.add('scrolled')
            else nav.classList.remove('scrolled')
          })
        },
        { threshold: 0.5 },
      )
      observer.observe(hero)
      cleanupFns.push(() => observer.disconnect())
    }

    const setupAnimateObserver = () => {
      const animateObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible')
              animateObserver.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -80px 0px', threshold: 0 },
      )

      const animated = Array.from(document.querySelectorAll('[data-animate]'))
      animated.forEach((el, index) => {
        if (el.classList.contains('stat')) el.dataset.delay = `${index * 120}`
        if (el.classList.contains('feature-card')) el.style.transitionDelay = `${index * 0.08}s`
        animateObserver.observe(el)
      })

      cleanupFns.push(() => {
        animated.forEach((el) => animateObserver.unobserve(el))
        animateObserver.disconnect()
      })
    }

    const setupAnchors = () => {
      const anchors = Array.from(document.querySelectorAll('a[href^="#"]'))
      const handleAnchor = (event) => {
        const id = event.currentTarget.getAttribute('href')
        if (!id || id === '#') return
        const target = document.querySelector(id)
        if (target) {
          event.preventDefault()
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }
      anchors.forEach((a) => a.addEventListener('click', handleAnchor))
      return () => anchors.forEach((a) => a.removeEventListener('click', handleAnchor))
    }

    const initGlobe = (THREE) => {
      const container = earthRef.current
      if (!container || !THREE) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
      camera.position.z = 2

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      renderer.outputColorSpace = THREE.SRGBColorSpace
      container.innerHTML = ''
      container.appendChild(renderer.domElement)

      const updateSize = () => {
        const w = container.clientWidth || 600
        const h = container.clientHeight || 600
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      updateSize()

      const texLoader = new THREE.TextureLoader()
      const urls = {
        map: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
        specular: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
        normal: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
        emissive: 'https://threejs.org/examples/textures/planets/earth_lights_2048.png',
        clouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
      }

      const group = new THREE.Group()
      scene.add(group)

      const starGeo = new THREE.BufferGeometry()
      const starCount = 9000
      const starPos = new Float32Array(starCount * 3)
      for (let i = 0; i < starCount * 3; i += 1) {
        starPos[i] = (Math.random() - 0.5) * 60
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.4 })
      const starsMesh = new THREE.Points(starGeo, starMat)
      scene.add(starsMesh)

      const earthGeometry = new THREE.SphereGeometry(1, 128, 128)
      const earthMap = texLoader.load(urls.map)
      earthMap.colorSpace = THREE.SRGBColorSpace
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthMap,
        specularMap: texLoader.load(urls.specular),
        normalMap: texLoader.load(urls.normal),
        normalScale: new THREE.Vector2(0.85, 0.85),
        emissiveMap: texLoader.load(urls.emissive),
        emissive: new THREE.Color(0xffcc66),
        emissiveIntensity: 0.15,
        specular: new THREE.Color(0x444466),
        shininess: 35,
      })
      const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial)
      group.add(earthMesh)

      const cloudGeo = new THREE.SphereGeometry(1.012, 128, 128)
      const cloudTex = texLoader.load(urls.clouds)
      const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudTex,
        alphaMap: cloudTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
      const clouds = new THREE.Mesh(cloudGeo, cloudMat)
      group.add(clouds)

      // 3. Atmosphere — inner Fresnel rim on front faces
      const atmosVertInner = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `
      const atmosFragInner = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          float intensity = pow(rim, 3.0) * 0.65;
          vec3 col = mix(vec3(0.35, 0.65, 1.0), vec3(0.15, 0.4, 0.9), rim);
          gl_FragColor = vec4(col, intensity);
        }
      `
      const atmosGeoInner = new THREE.SphereGeometry(1.015, 128, 128)
      const atmosMatInner = new THREE.ShaderMaterial({
        vertexShader: atmosVertInner,
        fragmentShader: atmosFragInner,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
      })
      const atmosInner = new THREE.Mesh(atmosGeoInner, atmosMatInner)
      group.add(atmosInner)

      // 4. Atmosphere — outer glow on back faces
      const atmosVertOuter = `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `
      const atmosFragOuter = `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(0.25, 0.55, 1.0, 1.0) * intensity * 0.5;
        }
      `
      const atmosGeoOuter = new THREE.SphereGeometry(1.08, 128, 128)
      const atmosMatOuter = new THREE.ShaderMaterial({
        vertexShader: atmosVertOuter,
        fragmentShader: atmosFragOuter,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      })
      const atmosOuter = new THREE.Mesh(atmosGeoOuter, atmosMatOuter)
      group.add(atmosOuter)

      // Lighting
      const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.5)
      sunLight.position.set(5, 2, 4)
      scene.add(sunLight)

      // Subtle blue fill from opposite side (space bounce light)
      const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3)
      fillLight.position.set(-3, -1, -2)
      scene.add(fillLight)

      scene.add(new THREE.AmbientLight(0x060610, 0.15))

      let animationId
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        earthMesh.rotation.y += 0.0012
        clouds.rotation.y += 0.0016
        starsMesh.rotation.y -= 0.0002
        renderer.render(scene, camera)
      }
      animate()

      window.addEventListener('resize', updateSize)

      cleanupFns.push(() => {
        cancelAnimationFrame(animationId)
        window.removeEventListener('resize', updateSize)
        renderer.dispose()
        starGeo.dispose()
        starMat.dispose()
        earthGeometry.dispose()
        earthMaterial.dispose()
        cloudGeo.dispose()
        cloudMat.dispose()
        atmosGeoInner.dispose()
        atmosMatInner.dispose()
        atmosGeoOuter.dispose()
        atmosMatOuter.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      })
    }

    addBackgroundStars()
    setupNavObserver()
    setupAnimateObserver()
    const removeAnchors = setupAnchors()

    const ensureThree = () =>
      new Promise((resolve) => {
        if (window.THREE) {
          resolve(window.THREE)
          return
        }
        threeScript = document.createElement('script')
        threeScript.src = THREE_CDN
        threeScript.async = true
        threeScript.onload = () => resolve(window.THREE)
        threeScript.onerror = () => resolve(null)
        head.appendChild(threeScript)
      })

    ensureThree().then((THREE) => {
      if (!isCancelled && THREE) initGlobe(THREE)
    })

    return () => {
      isCancelled = true
      cleanupFns.forEach((fn) => fn())
      if (removeAnchors) removeAnchors()
      addedLinks.filter(Boolean).forEach((link) => head.removeChild(link))
      if (threeScript && threeScript.parentNode) threeScript.parentNode.removeChild(threeScript)
    }
  }, [])

  return (
    <div className="landing-page">
      <div className="starfield">
        <div className="stars" id="bg-stars" ref={starsRef}>
          {Array.from({ length: 10 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      </div>

      <div className="earth-wrap" aria-hidden="true">
        <div className="earth-globe" id="earth-globe-container" ref={earthRef} />
      </div>

      <nav id="nav" ref={navRef}>
        <a href="#" className="logo">
          COSMIC WATCH
        </a>
        <ul className="nav-links">
          <li>
            <a href="/astrobook" onClick={(e) => { e.preventDefault(); navigate('/astrobook') }}>Astrobook</a>
          </li>
          <li>
            <a href="/community" onClick={(e) => { e.preventDefault(); navigate('/community') }}>Community</a>
          </li>
          <li>
            <a href="#support" onClick={(e) => { e.preventDefault(); scrollToSection('support') }}>Support</a>
          </li>
        </ul>
        <button className="cta-nav" type="button" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </nav>

      <header className="hero" ref={heroRef}>
        <div className="hero-orb" aria-hidden="true" />
        <p className="hero-badge">Near-Earth Object Monitoring</p>
        <h1>
          Track the Cosmos.
          <br />
          Protect the Planet.
        </h1>
        <p className="tagline">
          Real-time asteroid data from NASA, risk analysis, and alerts—in one immersive dashboard. For researchers,
          enthusiasts, and everyone who looks up.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" type="button" onClick={() => navigate('/dashboard')}>
            Launch Dashboard
          </button>
        </div>
      </header>

      <footer id="support">
        <div className="footer-grid">
          <div className="footer-col footer-brand">
            <h3>COSMIC WATCH</h3>
            <p>Tracking near-Earth objects in real time. Powered by NASA open data and a passion for planetary defense.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }}>Dashboard</a></li>
              <li><a href="/community" onClick={(e) => { e.preventDefault(); navigate('/community') }}>Community</a></li>
              <li><a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register') }}>Create Account</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="https://cneos.jpl.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA CNEOS</a></li>
              <li><a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Open API</a></li>
              <li><a href="https://www.asteroidday.org/" target="_blank" rel="noopener noreferrer">Asteroid Day</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact &amp; Support</h4>
            <ul>
              <li><a href="mailto:support@cosmicwatch.dev">support@cosmicwatch.dev</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
            <p className="footer-help">Have a question or found a bug? Reach out — we'd love to hear from you.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Cosmic Watch. All rights reserved.</p>
          <p className="footer-tagline">Built for the cosmos. Designed for humanity.</p>
        </div>
      </footer>
    </div>
  )
}
