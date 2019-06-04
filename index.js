import * as dat from 'dat.gui'
import random from 'lodash/random'
import Stats from 'stats.js'

const canvas = document.querySelector('#particles')
const ctx = canvas.getContext('2d')
const textCanvas = document.querySelector('#text')
const textCtx = textCanvas.getContext('2d')
window.particles = []
const config = {
    particles_amount: 200,
    new_particles_amount: 10,
    particle_width: 1,
    particle_color: 'rgb(107,255,0)',
    line_color: [107,255,0],
    min_speed: 0.1,
    max_speed: 0.4,
    max_connecting_distance: 44
}
const gui = new dat.GUI({
    width: 340
})
const particlesAmountController = gui
    .add(config, 'particles_amount', 1, 500)
    .name('Particles amount')
gui.add(config, 'min_speed', 0, 10).name('Minimum speed')
gui.add(config, 'max_speed', 0, 10).name('Maximum speed')
gui.add(config, 'max_connecting_distance', 0, 500).name('Connecting distance')
gui.addColor(config, 'particle_color').name('Particle color')
gui.addColor(config, 'line_color').name('Connection color')

particlesAmountController.onChange(() => {
    clearParticles()
    setup()
})

const stats = new Stats()
document.body.appendChild(stats.dom)

setup()
window.requestAnimationFrame(draw)

function addFixedParticles(data) {
    data.forEach(item => {
        particles.push(
            generateParticle({
                x: item.x,
                y: item.y,
                speedX: 0,
                speedY: 0,
                connectable: false,
                drawable: false,
            })
        )  
    })
}

function strokeText() {
    const size = 160
    textCtx.font = `bold ${size}px Impact`;
    textCtx.strokeStyle = `rgb(${config.line_color})`
    // textCtx.setLineDash([10, 10]);
    textCtx.strokeText('JANIGA', 100, size + 200);
}

function getData() {
    const imageData =  textCtx.getImageData(0, 0, canvas.width, canvas.height)
    console.log('imageData:', imageData)
    
    let x = 1
    let y = 1
    const boundary = []

    for (let i=0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i]
        const green = imageData.data[i + 1]
        const blue = imageData.data[i + 2]
        const alpha = imageData.data[i + 3]

        if (i > 0 && (i / 4) % imageData.width === 0) {
            x = 0
            y++

        }

        x++
        
        
        // console.log('color', red, green, blue, alpha)
        if (alpha > 0) {
            // console.log('x y:', x, y)
            boundary.push({
                x,
                y
            })
        }

    }
    
    console.log('boundary:', boundary.length)

    return boundary
}

function drawBackground() {
    ctx.setLineDash([40, 20, 50, 10])
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function setup () {
    setCanvasSize(window.innerWidth, window.innerHeight)
    drawBackground()
    attachHandlers()
    addCursorParticle()
    addParticles(config.particles_amount)
    strokeText()
    const textBoundary = getData()
    const transformedBoundary = textBoundary.filter((item, index) => index % 10 === 0)
    console.log('transformedBoundary:', transformedBoundary.length)
    addFixedParticles(transformedBoundary)
}

function addCursorParticle() {
    particles[0] = generateParticle({
        x: 0,
        y: 0,
        speedX: 0,
        speedY: 0
    })
}

function attachHandlers() {
    canvas.addEventListener('click', event => {
        addParticles(config.new_particles_amount, event.offsetX, event.offsetY)
    })

    canvas.addEventListener('mousemove', event => {
        particles[0].x = event.offsetX
        particles[0].y = event.offsetY
    })
}

function setCanvasSize(width, height) {
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    textCanvas.setAttribute('width', width);
    textCanvas.setAttribute('height', height);
}

function addParticles(amount, baseX, baseY) {
    for(let i=0; i < amount; i++) {
        const fixed = 0 //random(0, 1)
        particles.push(
            generateParticle({
                x: baseX || random(0, ctx.canvas.width),
                y: baseY || random(0, ctx.canvas.height),
                speedX: fixed ? 0 : getRandomSpeed(),
                speedY: fixed ? 0 : getRandomSpeed()
            })
        )
    }
}

function clearParticles() {
    particles = []
}

function generateParticle({ x, y, speedX, speedY, connectable = true, drawable = true }) {
    return {
        x,
        y,
        xDirection: getRandomDirection(),
        yDirection: getRandomDirection(),
        speedX,
        speedY,
        connectable,
        drawable
    }
}


function getRandomSpeed() {
    return random(config.min_speed, config.max_speed);
}

function getRandomDirection() {
    return random(0, 1) ? 1 : -1
}

function drawParticle(x, y, color = config.particle_color) {
    ctx.fillStyle = color
    ctx.fillRect(x, y, config.particle_width, config.particle_width);
}

function draw() {
    stats.begin()
    const canvasWidth = ctx.canvas.width
    const canvasHeight = ctx.canvas.height
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    drawBackground()

    particles.forEach(particle => {
        let newX = particle.x + particle.speedX * particle.xDirection
        let newY = particle.y + particle.speedY * particle.yDirection

        if (newX >= canvasWidth || newX <= 0) {
            particle.xDirection *= -1
            particle.speedX = getRandomSpeed()
            newX = particle.x + particle.speedX * particle.xDirection
        }

        if (newY >= canvasHeight || newY <= 0) {
            particle.yDirection *= -1
            particle.speedY = getRandomSpeed()
            newY = particle.y + particle.speedY * particle.xDirection
        }

        if (particle.drawable) {
            drawParticle(newX, newY)
        }

        particle.x = newX
        particle.y = newY

        if (particle.connectable) {
        const nearestParticles = findNearestParticles(particle)
        nearestParticles.forEach(nearParticle => {
            connectParticles(particle, nearParticle)
        })
    }
    })

    stats.end()
    window.requestAnimationFrame(draw)
}

function connectParticles(particle1, particle2) {
    const distanceBetweenParticles = getDistanceBetweenParticles(particle1, particle2)

    if (distanceBetweenParticles > config.max_connecting_distance) {
        return
    }

    const alpha = 1 - (distanceBetweenParticles / config.max_connecting_distance)
    ctx.beginPath()
    ctx.strokeStyle = `rgba(${config.line_color}, ${alpha})`
    ctx.moveTo(particle1.x, particle1.y)
    ctx.lineTo(particle2.x, particle2.y)
    ctx.stroke()
}

function getDistanceBetweenParticles(particle1, particle2) {
    return Math.sqrt(Math.pow(particle2.x - particle1.x, 2) + Math.pow(particle2.y - particle1.y, 2))
}

function findNearestParticles(particleStart, radius = config.max_connecting_distance) {
    const nearestParticles = []
    particles.forEach(particle => {
        if (getDistanceBetweenParticles(particleStart, particle) <= radius) {
            nearestParticles.push(particle)
        }
    })

    return nearestParticles
}



