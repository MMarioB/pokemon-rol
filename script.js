document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const introScreen = document.getElementById('intro-screen');
    const startButton = document.getElementById('start-button');
    const heroSection = document.getElementById('hero');
    const scrollProgress = document.getElementById('scroll-progress');
    const backToTopButton = document.getElementById('back-to-top');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.querySelector('header');
    const ambientAudio = document.getElementById('ambient-audio');
    const clickSound = document.getElementById('click-sound');
    const audioControl = document.getElementById('audio-control');
    const customCursor = document.getElementById('custom-cursor');
    const statusText = document.getElementById('status-text');


    let lastClickedNavLink = null;
    let userInteracted = false;
    let audioVolume = 0.3;
    ambientAudio.volume = audioVolume;
    clickSound.volume = 0.5;

    // --- Custom Cursor ---
    const enableCustomCursor = !('ontouchstart' in window || navigator.maxTouchPoints); // Solo si no es táctil
    if (enableCustomCursor) {
        document.body.style.cursor = 'none'; // Oculta el cursor por defecto
        customCursor.style.display = 'block';

        let cursorX = 0;
        let cursorY = 0;
        let isMoving = false;
        let fadeTimeout;

        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            if (!isMoving) {
                requestAnimationFrame(moveCursor);
                isMoving = true;
            }
            customCursor.classList.remove('faded');
            clearTimeout(fadeTimeout);
            fadeTimeout = setTimeout(() => {
                customCursor.classList.add('faded');
            }, 500);
        });

        function moveCursor() {
            customCursor.style.left = `${cursorX}px`;
            customCursor.style.top = `${cursorY}px`;
            isMoving = false;
        }
    } else {
        customCursor.style.display = 'none'; // ocultar en dispositivos táctiles
    }

    // --- Preloader ---
    // Seleccionar todas las imágenes con loading="lazy" y también la sección hero porque su imagen de fondo se carga de forma custom
    const imagesToLoad = document.querySelectorAll('img[loading="lazy"], .hero-section');
    const totalResources = imagesToLoad.length;
    let loadedResources = 0;

    const incrementLoader = () => {
        loadedResources++;
        if (loadedResources === totalResources) {
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.classList.add('loaded'); // Mostrar contenido de la página
                handleFirstUserInteraction(); // Disparar la interacción inicial del usuario para el audio
            }, 500); // Pequeño delay de gracia antes de ocultar
        }
    };

    if (totalResources === 0) { // Si no hay recursos que esperar, ocultar el preloader inmediatamente
        incrementLoader();
    } else {
        imagesToLoad.forEach(item => {
            // Cargar imagen de fondo del hero explícitamente para controlar su carga
            if (item.classList.contains('hero-section')) {
                const heroImage = new Image();
                heroImage.src = 'imagen1.jpg'; // Usar la URL directa de la imagen
                heroImage.onload = () => {
                    item.classList.add('image-loaded'); // Clase CSS para aplicar la imagen y su transición
                    incrementLoader();
                };
                heroImage.onerror = () => { // Manejo de error: importante para no bloquear el preloader
                    console.error('Error loading hero image');
                    item.classList.add('image-loaded'); // Asumir cargada para no bloquear
                    incrementLoader();
                };
            } else if (item.tagName === 'IMG') { // Para imágenes regulares
                const tempImg = new Image();
                tempImg.src = item.src; // La URL de la imagen en el atributo src
                tempImg.onload = () => {
                    item.classList.add('loaded'); // Clase CSS para remover el blur
                    incrementLoader();
                };
                tempImg.onerror = () => {
                    console.error('Error loading gallery image:', item.src);
                    item.classList.add('loaded'); // Asegura que el blur se quite incluso si hay error
                    incrementLoader();
                };
            }
        });
    }

    // --- Utilidades ---
    function splitTextIntoWords(element) {
        const text = element.textContent;
        element.innerHTML = ''; // Limpiar el contenido actual
        const words = text.split(' ').filter(word => word.length > 0); // Dividir por espacios, filtrar vacíos
        words.forEach((word, index) => {
            const wordSpan = document.createElement('span');
            wordSpan.textContent = word + ' '; // Añadir espacio de vuelta
            wordSpan.style.setProperty('--word-index', index); // Para posibles animaciones por palabra
            wordSpan.style.whiteSpace = 'nowrap'; // Evita que las palabras se rompan en múltiples líneas
            element.appendChild(wordSpan);
        });
    }

    function generateRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // --- Feedback Háptico (Vibración) ---
    function vibrate(duration = 50) {
        if ('vibrate' in navigator) { // Comprueba si la API de vibración está disponible
            navigator.vibrate(duration);
        }
    }

    // --- Control de Audio Ambiental ---
    function toggleAudio() {
        if (ambientAudio.paused) {
            ambientAudio.play().then(() => {
                audioControl.textContent = '🔊'; // Icono de sonido
            }).catch(error => {
                console.warn("Autoplay prevented:", error);
                audioControl.textContent = '🔇'; // Icono de mute
                audioControl.title = "Autoplay blocked. Click to play."; // Mensaje de ayuda
            });
        } else {
            ambientAudio.pause();
            audioControl.textContent = '🔇'; // Icono de mute
        }
        vibrate(20); // Pequeña vibración al alternar el audio
    }

    audioControl.addEventListener('click', toggleAudio);

    // Esta función intenta iniciar el audio (desmuteándolo y reproduciéndolo)
    // Se ejecuta una vez que el usuario ha interactuado con la página por primera vez.
    function handleFirstUserInteraction() {
        if (!userInteracted) { // Solo si no ha habido interacción previa
            userInteracted = true;
            ambientAudio.muted = false; // Desmutear el audio
            toggleAudio(); // Llamar a toggle para intentar reproducir
            // Eliminar los listeners una vez que la interacción ha sido detectada y manejada.
            document.removeEventListener('click', handleFirstUserInteraction, { once: true });
            document.removeEventListener('keydown', handleFirstUserInteraction, { once: true });
        }
    }

    // Listeners para la primera interacción del usuario (para el autoplay)
    // Usamos { once: true } para que el listener se elimine automáticamente después de la primera ejecución.
    // Usamos { passive: true } para mejorar el rendimiento de scroll/touch en móviles.
    document.addEventListener('click', handleFirstUserInteraction, { once: true, passive: true });
    // También detectamos interacción por teclado
    document.addEventListener('keydown', handleFirstUserInteraction, { once: true, passive: true });

    // Ajuste de volumen del audio según el scroll
    const adjustAudioVolume = () => {
        const scrolled = window.scrollY;
        const heroHeight = heroSection.offsetHeight; // Altura de la sección hero
        let newVolume = audioVolume; // Volumen base

        // Atenuar volumen al inicio (en la parte superior del hero)
        if (scrolled < heroHeight * 0.5) { // En la primera mitad de la sección hero
            newVolume = audioVolume * (scrolled / (heroHeight * 0.5));
        }
        // Atenuar volumen al final de la página
        else if (scrolled > document.body.scrollHeight - window.innerHeight - (heroHeight * 0.5)) { // Cuando se está a 50% de la altura del hero del final de la página
            newVolume = audioVolume * ((document.body.scrollHeight - window.innerHeight - scrolled) / (heroHeight * 0.5));
        }

        // Asegurarse de que el volumen esté entre 0 y el volumen base definido
        ambientAudio.volume = Math.max(0, Math.min(audioVolume, newVolume));
    };
    window.addEventListener('scroll', adjustAudioVolume, { passive: true });


    // --- Pantalla de Bienvenida ---
    if (introScreen && startButton) {
        const introTitle = introScreen.querySelector('h2'); // h2 ya tiene text-reveal-word
        if (introTitle) {
            splitTextIntoWords(introTitle); // Preparar el texto para la animación palabra por palabra
            setTimeout(() => {
                introTitle.classList.add('revealed'); // Iniciar la animación
                introTitle.classList.remove('glitch-effect'); // Remover el glitch al empezar la animación del texto
            }, 500); // Pequeño retraso al cargar la intro
        }

        startButton.addEventListener('click', () => {
            vibrate(50); // Feedback háptico al click en el botón de inicio

            // Aplicar efecto de desintegración a la pantalla de intro
            introScreen.classList.add('disintegrate');

            // Ocultar la pantalla de intro completamente después de que la animación termine
            introScreen.addEventListener('animationend', () => {
                introScreen.classList.add('hidden');
            }, { once: true }); // El listener se ejecuta solo una vez

            // Preparar y animar los títulos del hero después de la intro
            const heroTitles = heroSection.querySelectorAll('.text-reveal-word');
            heroTitles.forEach(title => splitTextIntoWords(title)); // Primero, dividir el texto

            setTimeout(() => { // Pequeño retraso para que los títulos del hero aparezcan después de que la intro empiece a desintegrarse
                heroTitles.forEach((title, index) => {
                    setTimeout(() => {
                        title.classList.add('revealed'); // Iniciar la animación de cada palabra
                    }, index * 200); // Delay escalonado para cada título
                });
            }, 800); // 800ms para permitir que la intro se desintegre un poco antes de revelar el hero
        });
    }

    // --- Observador de Intersección para animaciones al hacer scroll ---
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated'); // Inicia la animación de la sección (translateY, opacity)

                const sectionTitle = entry.target.querySelector('.section-title');
                if (sectionTitle) {
                    if (!sectionTitle.classList.contains('text-reveal-word')) { // Asegura que solo se prepare una vez
                        splitTextIntoWords(sectionTitle);
                    }
                    if (!sectionTitle.classList.contains('revealed')) { // Solo anima si no ha sido revelado
                        setTimeout(() => {
                            sectionTitle.classList.add('revealed'); // Anima el texto palabra por palabra
                            sectionTitle.classList.add('active-glow'); // Activar el brillo del título
                        }, 300); // Pequeño retraso después de que la sección aparece
                    }
                }

                // Animación de list items en Habilidades con delay escalonado y diamantes
                if (entry.target.id === 'habilidades') {
                    const listItems = entry.target.querySelectorAll('ul li');
                    listItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('revealed'); // Anima cada elemento de la lista
                        }, index * 100); // Delay escalonado para cada item de la lista
                    });
                }
                observer.unobserve(entry.target); // Dejar de observar la sección una vez animada
            }
        });
    }, observerOptions);

    // Observar todas las secciones de contenido para sus animaciones al entrar en vista
    document.querySelectorAll('.content-section').forEach(element => {
        observer.observe(element);
    });

    // --- Lógica Header, Navegación y Scroll ---
    // Listener para el borde superior animado del header cuando se vuelve sticky
    const headerStickyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const headerEl = entry.target;
            // headerEl.getBoundingClientRect().top === 0 garantiza que está pegado arriba.
            // entry.intersectionRatio < 1 asegura que no está completamente en pantalla (es decir, se ha desplazado).
            if (entry.intersectionRatio < 1 && entry.boundingClientRect.top <= 0) {
                headerEl.classList.add('is-sticky');
            } else {
                headerEl.classList.remove('is-sticky');
            }
        });
    }, { threshold: [0, 1] }); // Observar cuando el header entra y sale de la vista

    headerStickyObserver.observe(header); // Observar el header

    // Función para resaltar el enlace de navegación activo según la sección visible
    const highlightNavLink = () => {
        let current = '';
        const headerOffset = header ? header.offsetHeight : 0;
        const scrollY = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerOffset - 50; // Ajuste para activar la sección un poco antes
            // La sección se considera "actual" si su parte superior ha pasado el punto de scroll
            // y aún no hemos pasado la mayor parte de la sección.
            if (scrollY >= sectionTop && scrollY < section.offsetTop + section.offsetHeight - (window.innerHeight * 0.2)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active'); // Remover clase activa de todos los enlaces
            if (link.href && link.href.includes(current)) {
                link.classList.add('active'); // Añadir clase activa al enlace de la sección actual
            }
        });
    };

    window.addEventListener('scroll', highlightNavLink, { passive: true }); // Escucha el evento de scroll con passive true para rendimiento
    highlightNavLink(); // Llama al inicio para fijar la sección activa al cargar la página

    // Manejador de eventos para clics en los enlaces de navegación (smooth scroll y animación)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del enlace (salto instantáneo)
            vibrate(10); // Feedback háptico al click
            if (clickSound) { // Reproducir sonido de click si el elemento de audio existe
                clickSound.currentTime = 0; // Reiniciar el sonido para que se pueda reproducir rápido
                clickSound.play();
            }

            // Efecto de "clic" visual en el nav-link activo
            if (lastClickedNavLink && lastClickedNavLink.link) {
                lastClickedNavLink.link.classList.remove('clicked'); // Quitar efecto de "clic" del enlace anterior
            }
            link.classList.add('active', 'clicked'); // Marcar el enlace actual como activo y con efecto "clic"
            // Eliminar la clase 'clicked' después de una breve animación
            setTimeout(() => {
                link.classList.remove('clicked');
            }, 300); // La duración coincide con el CSS del efecto "clic"

            const targetId = link.getAttribute('href').substring(1); // Obtener el ID de la sección objetivo
            const targetSection = document.getElementById(targetId); // Elemento de la sección objetivo

            if (targetSection) {
                // Eliminar la animación de 'nav-target-active' de la sección anterior si existe
                if (lastClickedNavLink && lastClickedNavLink.targetSection) {
                    lastClickedNavLink.targetSection.classList.remove('nav-target-active');
                }

                // Calcular la posición de scroll ajustada por el header sticky
                const offsetTop = targetSection.offsetTop - (header ? header.offsetHeight : 0) - 10; // 10px de margen extra
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth' // Scroll suave
                });

                // Almacenar la sección actual como la última clickeada para futuras animaciones
                lastClickedNavLink = { link, targetSection };
                targetSection.classList.add('nav-target-active'); // Activar animación de borde de la sección

                // Una vez que la animación de `nav-target-active` termina, la removemos.
                // Usamos `animationend` para asegurarnos de que la animación ha completado.
                const handleAnimationEnd = () => {
                    targetSection.classList.remove('nav-target-active');
                    targetSection.removeEventListener('animationend', handleAnimationEnd); // Limpieza del listener
                };
                targetSection.addEventListener('animationend', handleAnimationEnd);
            }
        });
    });

    // --- Scroll Progress Indicator ---
    const updateScrollProgress = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const progressPercentage = (scrollPosition / totalHeight) * 100;
        scrollProgress.style.width = `${progressPercentage}%`;
    };
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress(); // Llama al inicio para fijar la posición inicial

    // --- Efecto Paralaje Hero Section / Desvanecimiento Texto Hero ---
    const heroTextElements = heroSection.querySelectorAll('.hero-fade-text');
    const applyParallaxAndFade = () => {
        if (heroSection) {
            const scrolled = window.scrollY;
            heroSection.style.backgroundPositionY = `calc(50% + ${scrolled * 0.3}px)`; // Efecto paralaje

            const heroHeight = heroSection.offsetHeight;
            heroTextElements.forEach(el => {
                const opacity = 1 - Math.max(0, (scrolled - (heroHeight * 0.3)) / (heroHeight * 0.4)); // Calcular opacidad
                el.style.opacity = Math.max(0, opacity);
                el.style.transform = `translateY(${scrolled * 0.1}px)`; // Pequeño movimiento vertical
            });
        }
    };
    window.addEventListener('scroll', applyParallaxAndFade, { passive: true });
    applyParallaxAndFade(); // Aplicar al cargar la página

    // --- Back to Top Button ---
    const toggleBackToTopButton = () => {
        if (window.scrollY > window.innerHeight / 2) { // Aparece después de scroll un 50% de la altura de la ventana
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    };
    window.addEventListener('scroll', toggleBackToTopButton, { passive: true });
    toggleBackToTopButton(); // Comprobar la visibilidad al cargar la página

    backToTopButton.addEventListener('click', () => {
        vibrate(10); // Feedback háptico
        if (clickSound) { // Reproducir sonido de click
            clickSound.currentTime = 0;
            clickSound.play();
        }
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Scroll suave hacia arriba
        });
    });

    // --- Partículas de Fondo ---
    function createParticles(containerElement, count) {
        const particlesContainer = containerElement.querySelector('.particles-container');
        if (!particlesContainer) return;
        particlesContainer.innerHTML = ''; // Limpiar partículas existentes para regenerarlas si JS se recarga

        let actualCount = count;
        if (window.innerWidth < 768) { // Ejemplo de adaptación para móviles: menos partículas
            actualCount = Math.floor(count * 0.5);
        }

        for (let i = 0; i < actualCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = generateRandom(0.8, 2); // ligeras variaciones de tamaño de partícula
            const delay = generateRandom(0, 15); // Retraso de animación
            const duration = generateRandom(15, 30); // Duración total de la animación

            // Posiciones iniciales, intermedias y finales para un movimiento no lineal
            const startX = generateRandom(-10, 110); // Fuera de pantalla a la izquierda/derecha
            const startY = generateRandom(-10, 110);
            const endX = generateRandom(-20, 120);
            const endY = generateRandom(-20, 120);

            // Puntos intermedios para curvas más complejas
            const midX = (startX + endX) / 2 + generateRandom(-20, 20);
            const midY = (startY + endY) / 2 + generateRandom(-20, 20);

            const zIndex = generateRandom(-100, 100); // Para efecto 3D Z-index (cercanía/lejanía)

            // Asignar variables CSS a la partícula para animación
            particle.style.setProperty('--particle-size', `${size}px`);
            particle.style.setProperty('--delay', `${delay}s`);
            particle.style.setProperty('--start-x', `${startX}vw`);
            particle.style.setProperty('--start-y', `${startY}vh`);
            particle.style.setProperty('--mid-x', `${midX}vw`);
            particle.style.setProperty('--mid-y', `${midY}vh`);
            particle.style.setProperty('--end-x', `${endX}vw`);
            particle.style.setProperty('--end-y', `${endY}vh`);
            particle.style.setProperty('--z-index', `${zIndex}px`); // Asignar Z para efecto 3D
            particle.style.animationDuration = `${duration}s`;

            particlesContainer.appendChild(particle);
        }
    }

    createParticles(heroSection, 80); // 80 partículas en el Hero
    createParticles(document.querySelector('footer'), 60); // 60 partículas en el Footer

    // --- Hover con efecto Tilt/Parallax en Galería ---
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        const MAX_ROTATION = 8; // Rotación máxima en grados
        const MAX_TRANSLATION_IMG = 10; // Traslación máxima de la imagen dentro del contenedor
        const MAX_TRANSLATION_ITEM = 5; // Traslación máxima del contenedor completo (para simular profundidad)

        item.addEventListener('mousemove', (e) => {
            vibrate(1); // Pequeña vibracion al mover sobre item de galeria
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left; // Posición X dentro del elemento
            const y = e.clientY - rect.top;  // Posición Y dentro del elemento

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calcular inclinación (rotateX y rotateY opuestos para efecto 3D correcto)
            const rotateX = ((y - centerY) / centerY) * -MAX_ROTATION;
            const rotateY = ((x - centerX) / centerX) * MAX_ROTATION;

            // Calcular traslación de la imagen (efecto mouse por detrás)
            const translateXImg = ((x - centerX) / centerX) * MAX_TRANSLATION_IMG;
            const translateYImg = ((y - centerY) / centerY) * MAX_TRANSLATION_IMG;

            // Calcular traslación del item completo (simula que el item se acerca al mouse)
            const translateXItem = ((x - centerX) / centerX) * MAX_TRANSLATION_ITEM;
            const translateYItem = ((y - centerY) / centerY) * MAX_TRANSLATION_ITEM;

            // Aplicar transformaciones
            // El `scale(1.03)` es un ligero zoom al hover
            item.style.transform = `translate(${translateXItem}px, ${translateYItem}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
            img.style.transform = `translateX(${translateXImg}px) translateY(${translateYImg}px) scale(1.02)`; // Ligero zoom adicional en la imagen
            item.classList.add('tilt-active'); // Activar clase para CSS
        }, { passive: true }); // {passive: true} para mejorar rendimiento en mobile

        item.addEventListener('mouseleave', () => {
            // Restablecer transformaciones al salir del hover
            item.style.transform = `translate(0px, 0px) rotateX(0deg) rotateY(0deg) scale(1)`;
            img.style.transform = `translateX(0px) translateY(0px) scale(1)`;
            item.classList.remove('tilt-active'); // Quitar clase
        });
    });

    // --- Actualizar año en el pie de página ---
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}); // Cierre de DOMContentLoaded