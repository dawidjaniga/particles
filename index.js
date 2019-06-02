import random from 'lodash/random'

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const particles = []
const config = {
    particles_amount: 10,
    new_particles_amount: 10,
    particle_width: 1,
    particle_color: '#fff',
    line_color: '255, 255, 255',
    min_speed: 0.1,
    max_speed: 0.4,
    max_connecting_distance: 50
}

setup()
addParticles(config.particles_amount)
window.requestAnimationFrame(draw)

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function setup () {
    setCanvasSize(window.innerWidth, window.innerHeight)
    drawBackground()
    attachHandlers()
}

function attachHandlers() {
    canvas.addEventListener('click', event => {
        addParticles(config.new_particles_amount, event.offsetX, event.offsetY)
    })
}

function setCanvasSize(width, height) {
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
}

function addParticles(amount, baseX, baseY) {
    for(let i=0; i < amount; i++) {
        particles.push(
            generateParticle(
                baseX || random(0, ctx.canvas.width),
                baseY || random(0, ctx.canvas.height)
            )
        )
    }
}

function generateParticle(x, y) {
    return {
        x,
        y,
        xDirection: getRandomDirection(),
        yDirection: getRandomDirection(),
        speedX: getRandomSpeed(),
        speedY: getRandomSpeed()
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

        drawParticle(newX, newY)
        particle.x = newX
        particle.y = newY

        const nearestParticles = findNearestParticles(particle)
        nearestParticles.forEach(nearParticle => {
            connectParticles(particle, nearParticle)
        })
    })

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



