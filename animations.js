addEventListener("DOMContentLoaded", () => {
  // unlock sounds
  const unlockSound = new Howl({
    src: [
      "https://cdn.jsdelivr.net/gh/nrmarston/portfolio-v3-wf@main/public/sounds/unlock.mp3",
    ],
    volume: 0.5,
  });

  // Register GSAP Plugins
  gsap.registerPlugin(Draggable, MorphSVGPlugin, SplitText, TextPlugin);

  // Cache DOM elements
  const handle = document.querySelector("#stu_handle");
  const iconPath = document.querySelector("#iconPath");
  const bgText = document.querySelector("#stu_bg-text");
  const track = document.querySelector("#stu_track");
  const trackEnd = document.querySelector("#stu_end");

  // Cache icon selectors
  const lockedIcon = "#lockedIcon";
  const unlockedIcon = "#unlockedIcon";

  // Cache colors
  const COLORS = {
    primary: "var(--colors--primary)",
    primaryFg: "var(--colors--primary-foreground)",
    secondary: "var(--_color---secondary)",
    secondaryFg: "var(--_color---secondary-foreground)",
    accent: "var(--_color---accent)",
    accentFg: "var(--_color---accent-foreground)",
    foreground: "var(--colors-foreground)",
    success: "#218358",
  };

  // Create a timeline
  const tl = gsap.timeline({ paused: true });

  let waveTL = null;
  let splitText = null;

  function startWave() {
    if (waveTL) waveTL.kill();
    gsap.set(splitText.chars, { opacity: 0.6 });
    waveTL = gsap.to(splitText.chars, {
      opacity: 1,
      stagger: { each: 0.15, yoyo: true, repeat: -1 },
      duration: 0.75,
      repeat: -1,
      ease: "power3.inOut",
    });
  }

  document.fonts.ready.then(() => {
    splitText = new SplitText(bgText, { type: "chars" });
    startWave();
  });

  const draggable = Draggable.create(handle, {
    type: "x",
    bounds: track,
    dragResistance: 0.2,
    edgeResistance: 1,
    throwResistance: 2500,
    onDrag: updateUI,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onPressInit: handlePressInit,
  })[0]; // Get the Draggable instance

  // Handle drag start
  function handleDragStart() {
    console.log("Drag started");
  }

  // Handle press init
  function handlePressInit() {
    console.log("Handle pressed");
  }

  // Handle release
  function handleDragRelease() {
    console.log("Handle released");
    gsap.set(handle, { backgroundColor: COLORS.secondary, opacity: 1 });
  }

  // Update UI based on progress
  let prevX = 0;

  function updateUI() {
    const progress = this.x / this.maxX;

    // Only update opacity when dragging to the right and drag distance is significant
    if (this.x >= prevX && this.x > 10) {
      const opacityValue = gsap.utils.interpolate(1, 0, progress * 2);
      gsap.set(bgText, { opacity: opacityValue });
    }

    // Check for overlap between handle and trackEnd
    if (Draggable.hitTest(handle, trackEnd, "15%")) {
      gsap.to(trackEnd, {
        opacity: 1,
        duration: 0.2,
        borderColor: COLORS.success,
        backgroundColor: COLORS.accent,
      });
    } else {
      gsap.to(trackEnd, {
        opacity: 0,
        duration: 0.2,
        borderColor: COLORS.accentFg,
        backgroundColor: "transparent",
      });
    }

    prevX = this.x;
  }

  function handleDragEnd() {
    const maxX = this.maxX;
    const threshold = maxX * 0.85;
    if (this.x >= threshold) {
      unlock();
    } else {
      lock();
    }
  }

  function unlock() {
    if (waveTL) waveTL.kill();
    // Ensure trackEnd is visually updated
    gsap.to(trackEnd, {
      opacity: 0,
      borderColor: COLORS.success,
      duration: 0.2,
    });
    const unlockTL = gsap.timeline();

    unlockTL
      .to(bgText, {
        opacity: 0,
        duration: 0,
      })
      .to(
        draggable.target,
        {
          x: draggable.maxX,
          duration: 0.15,
        },
        "+=0.15"
      )
      .to(iconPath, {
        morphSVG: unlockedIcon,
        duration: 0.2,
      })
      .to(
        handle,
        {
          color: COLORS.primaryFg,
          backgroundColor: COLORS.primary,
          duration: 0.15,
          ease: "power3.out",
        },
        "-=0.05"
      ) // Slight overlap for smoother transition
      .to(
        bgText,
        {
          text: "Unlocked!",
          color: COLORS.success,
          duration: 0.15,
          ease: "power3.out",
        },
        "+=0.05"
      )
      .to(bgText, {
        opacity: 1,
        duration: 0.15,
        ease: "power3.out",
      });

    setTimeout(() => {
      unlockSound.stop(); // Ensures it starts from the beginning
      unlockSound.play();
    }, 300);
    console.log("Unlocked!");
  }

  function lock() {
    // Ensure trackEnd is visually updated
    gsap.to(trackEnd, {
      opacity: 0,
      borderColor: COLORS.accentFg,
      backgroundColor: "transparent",
      duration: 0.2,
    });
    // Create a timeline for smoother combined animations
    const lockTl = gsap.timeline();

    lockTl
      .to(bgText, {
        opacity: 0,
        duration: 0,
      })
      .to(draggable.target, {
        x: 0,
        duration: 0.3,
      })
      .to(iconPath, {
        morphSVG: lockedIcon,
        duration: 0.15,
      })
      .to(handle, {
        color: COLORS.secondaryFg,
        backgroundColor: COLORS.secondary,
        duration: 0.15,
      })
      .to(bgText, {
        text: "Slide to unlock.",
        color: COLORS.foreground,
        duration: 0.15,
        ease: "power3.out",
      })
      .to(bgText, {
        opacity: 1,
        duration: 0.15,
        ease: "power3.out",
        onComplete: () => {
          splitText = new SplitText(bgText, { type: "chars" });
          startWave();
        },
      });
  }

  // Keyboard shortcut: Shift+L to lock/unlock
  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "l") {
      if (parseInt(gsap.getProperty(handle, "x")) < draggable.maxX) {
        unlock();
      } else {
        lock();
      }
      e.preventDefault();
    }
  });

  // Initialize in locked state
  handle.setAttribute("aria-pressed", "false");
  handle.setAttribute("role", "button");
  handle.setAttribute("tabindex", "0");
});
