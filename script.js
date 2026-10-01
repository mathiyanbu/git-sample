document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}

menuButton.addEventListener("click", () => {
  const opening = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(opening));
  menuButton.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("is-open", opening);
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    if (projectDialog.open) projectDialog.close();
  }
});

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sectionLinks = [...document.querySelectorAll(".nav-links a")];
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        const active = link.hash === `#${entry.target.id}`;
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
        link.classList.toggle("active", active);
      });
    });
  }, { rootMargin: "-28% 0px -62% 0px" });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

const projectDetails = [
  {
    name: "Ride Sentinel",
    description: "AI & Embedded school transportation safety system.",
    technologies: "ESP32 · IoT · AI"
  },
  {
    name: "DRDO UAV Project",
    description: "AI-assisted UAV research with PCB and embedded systems.",
    technologies: "UAV · PCB · Embedded"
  },
  {
    name: "ADAS for Electric Bus",
    description: "YOLO-based object detection prototype for EV safety.",
    technologies: "YOLO · EV · ADAS"
  },
  {
    name: "Rescue Drone",
    description: "UAV concept for emergency response and disaster support.",
    technologies: "Not specified."
  },
  {
    name: "Surveillance Drone",
    description: "UAV for aerial monitoring and reconnaissance.",
    technologies: "Not specified."
  },
  {
    name: "UAV PCB Design",
    description: "Power Distribution Board designed using KiCad.",
    technologies: "KiCad · Power Distribution Board"
  }
];

const projectDialog = document.querySelector(".project-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector(".dialog-description");
const dialogTechnology = document.querySelector(".dialog-tech p");
const unspecifiedDetails = "Details to be added.";

document.querySelectorAll(".project-card").forEach((card) => {
  const button = card.querySelector(".open-project");
  button.addEventListener("click", () => {
    const project = projectDetails[Number(card.dataset.project)];
    if (!project) return;

    dialogTitle.textContent = project.name;
    dialogDescription.textContent = project.description;
    dialogTechnology.textContent = project.technologies;
    projectDialog.querySelectorAll(".dialog-specs > div p").forEach((detail) => {
      detail.textContent = unspecifiedDetails;
    });
    projectDialog.showModal();
  });
});

const canvas = document.querySelector(".lab-canvas");
const context = canvas.getContext("2d", { alpha: true });
const pointer = { x: -1000, y: -1000, active: false };
let width = 0;
let height = 0;
let scale = 1;
let traces = [];
let particles = [];
let frame = 0;
let lastFrameTime = 0;
let animationRunning = false;
const spacing = 46;

function makeCircuitPaths() {
  const columns = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const paths = [];

  for (let index = 0; index < Math.max(8, Math.floor((columns * rows) / 20)); index += 1) {
    const startX = Math.floor(Math.random() * columns) * spacing;
    const startY = Math.floor(Math.random() * rows) * spacing;
    const horizontal = (Math.random() < 0.5 ? -1 : 1) * spacing * (1 + Math.floor(Math.random() * 3));
    const vertical = (Math.random() < 0.5 ? -1 : 1) * spacing * (1 + Math.floor(Math.random() * 2));
    const endX = Math.min(width, Math.max(0, startX + horizontal));
    const endY = Math.min(height, Math.max(0, startY + vertical));
    const points = [{ x: startX, y: startY }, { x: endX, y: startY }, { x: endX, y: endY }];
    const length = Math.abs(endX - startX) + Math.abs(endY - startY);
    if (length > spacing) paths.push({ points, length, phase: Math.random(), speed: 0.018 + Math.random() * 0.018 });
  }

  traces = paths;
  particles = paths.filter(() => Math.random() < 0.45).map((path) => ({ path, phase: Math.random() }));
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  scale = Math.min(window.devicePixelRatio || 1, 1.35);
  width = bounds.width;
  height = bounds.height;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  makeCircuitPaths();
  if (reducedMotion.matches) drawScene(0, false);
}

function pointOnPath(path, progress) {
  let distance = ((progress % 1) + 1) % 1 * path.length;
  for (let index = 1; index < path.points.length; index += 1) {
    const from = path.points[index - 1];
    const to = path.points[index];
    const segmentLength = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    if (distance <= segmentLength) {
      const part = segmentLength === 0 ? 0 : distance / segmentLength;
      return { x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part };
    }
    distance -= segmentLength;
  }
  return path.points[path.points.length - 1];
}

function drawScene(time, animate = true) {
  context.clearRect(0, 0, width, height);

  const offset = animate ? (time * 0.003) % spacing : 0;
  context.lineWidth = 0.6;
  context.strokeStyle = "rgba(99, 238, 208, 0.055)";
  context.beginPath();
  for (let x = -spacing + offset; x < width + spacing; x += spacing) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = -spacing + offset; y < height + spacing; y += spacing) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  traces.forEach((path) => {
    context.beginPath();
    context.moveTo(path.points[0].x, path.points[0].y);
    path.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.strokeStyle = "rgba(76, 160, 128, 0.14)";
    context.lineWidth = 0.8;
    context.stroke();

    if (animate) {
      const pulse = pointOnPath(path, (time * 0.000045 * path.speed * 36) + path.phase);
      context.beginPath();
      context.arc(pulse.x, pulse.y, 1.5, 0, Math.PI * 2);
      context.fillStyle = "rgba(99, 238, 208, 0.75)";
      context.shadowBlur = 8;
      context.shadowColor = "rgba(99, 238, 208, 0.7)";
      context.fill();
      context.shadowBlur = 0;
    }
  });

  const nodes = traces.map((path) => path.points[0]);
  context.lineWidth = 0.65;
  for (let first = 0; first < nodes.length; first += 1) {
    const from = nodes[first];
    let nearest = null;
    let nearestDistance = 116;
    for (let second = first + 1; second < nodes.length; second += 1) {
      const to = nodes[second];
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      if (distance < nearestDistance) {
        nearest = to;
        nearestDistance = distance;
      }
    }
    if (nearest) {
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(nearest.x, nearest.y);
      context.strokeStyle = `rgba(86, 190, 151, ${0.055 * (1 - nearestDistance / 145)})`;
      context.stroke();
    }
  }

  if (animate) {
    particles.forEach((particle) => {
      particle.phase = (particle.phase + particle.path.speed * 0.0008) % 1;
      const point = pointOnPath(particle.path, particle.phase);
      context.beginPath();
      context.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
      context.fillStyle = "rgba(114, 229, 157, 0.8)";
      context.shadowBlur = 7;
      context.shadowColor = "rgba(114, 229, 157, 0.65)";
      context.fill();
      context.shadowBlur = 0;
    });

    if (pointer.active) {
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
      glow.addColorStop(0, "rgba(99, 238, 208, 0.09)");
      glow.addColorStop(1, "rgba(99, 238, 208, 0)");
      context.fillStyle = glow;
      context.fillRect(pointer.x - 190, pointer.y - 190, 380, 380);
    }
  }
}

function animate(time) {
  animationRunning = false;
  if (document.hidden || reducedMotion.matches) return;
  if (time - lastFrameTime >= 33) {
    drawScene(time);
    lastFrameTime = time;
  }
  frame = window.requestAnimationFrame(animate);
  animationRunning = true;
}

function startAnimation() {
  if (!animationRunning && !document.hidden && !reducedMotion.matches) {
    frame = window.requestAnimationFrame(animate);
    animationRunning = true;
  }
}

function stopAnimation() {
  window.cancelAnimationFrame(frame);
  animationRunning = false;
}

canvas.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
canvas.addEventListener("pointerleave", () => { pointer.active = false; });
window.addEventListener("resize", resizeCanvas, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAnimation();
  else startAnimation();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    stopAnimation();
    drawScene(0, false);
  } else {
    startAnimation();
  }
});

resizeCanvas();
startAnimation();