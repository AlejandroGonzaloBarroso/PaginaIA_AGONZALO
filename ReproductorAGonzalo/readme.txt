======================================================
REPRODUCTOR MULTIMEDIA LOCAL CON CALENDARIO (VERSIÓN 16)

Este es un reproductor de música local completo construido enteramente como una aplicación web de un solo archivo (HTML/CSS/JavaScript). No requiere servidor y funciona cargando tu biblioteca de música directamente desde una carpeta de tu ordenador.

La aplicación utiliza Tailwind CSS para un diseño moderno y responsivo, y la Web Audio API para funciones de audio avanzadas como un eculador y un visualizador en tiempo real.

----[ Características Principales ]----

Esta aplicación combina un potente reproductor de música con un calendario de eventos.

:: 1. Gestión de Biblioteca ::

Carga de Carpeta Local: Carga tu biblioteca de música completa seleccionando una carpeta (la app escanea los archivos de audio).

Lector de Metadatos: Lee automáticamente los metadatos (Artista, Álbum, Carátula) de tus archivos de audio usando jsmediatags.

Biblioteca Inteligente: Organiza tu música en tres pestañas: Artistas, Álbumes y Pistas.

Doble Vista: Visualiza tu biblioteca como una lista detallada o como una rejilla (cuadrados) con carátulas.

Búsqueda Rápida: Filtra toda tu biblioteca en tiempo real con una única barra de búsqueda.

:: 2. Reproductor de Audio Avanzado ::

Reproductor Personalizado: Un reproductor de audio moderno que reemplaza el control estándar de HTML.

Cola de Reproducción: Crea una cola de reproducción automáticamente basada en el contexto (al reproducir un álbum, un artista o una lista).

Controles de Reproducción: Incluye botones de Aleatorio (Shuffle) y Repetir (Desactivado, Repetir Todo, Repetir Uno).

Visualizador de Audio: Un visualizador de barras en tiempo real en la barra del reproductor que reacciona a la música.

Eculador (EQ): Un eculador gráfico de 9 bandas (de 60Hz a 16kHz) para ajustar el sonido.

Control de Volumen: Control de volumen con deslizador e icono de silencio.

Navegación Rápida: El título y el artista en el reproductor son enlaces clicables que te llevan a su sección correspondiente en la biblioteca.

:: 3. Calendario de Eventos ::

Calendario Completo: Un calendario funcional con navegación por mes y año.

Gestión de Eventos: Haz clic en un día para añadir, editar o eliminar un evento.

Música en Eventos: Asigna cualquier canción de tu biblioteca a un evento del calendario. La canción se reproducirá al hacer clic en el día.

Exportar Evento: Exporta los detalles de cualquier evento a un archivo .txt.

:: 4. Ajustes y Personalización ::

Sistema de Temas: 5 temas visuales, incluyendo opciones claras y oscuras (Esmeralda, Zafiro, Rubí, Ámbar).

Opciones de Accesibilidad:

Tamaño de Fuente: Aumenta, disminuye o reinicia el texto.

Alto Contraste: Un modo de alto contraste para mejorar la legibilidad.

Modo Dislexia: Aplica la fuente OpenDyslexic a toda la interfaz.

Reducir Movimiento: Detiene todas las animaciones y transiciones.

Aumentar Espaciado: Añade más espacio entre letras y líneas.

:: 5. Datos y Persistencia ::

LocalStorage: Todos tus eventos del calendario, ajustes (tema, accesibilidad) e historial de reproducción se guardan en el almacenamiento local de tu navegador.

Exportar Historial: Descarga tu historial de reproducción completo como un archivo .txt.

----[ Cómo Usar ]----

En la pestaña "Biblioteca", haz clic en el botón "Cargar Carpeta".

Selecciona la carpeta de tu ordenador que contiene tus archivos de música (MP3, FLAC, etc.).

¡Espera a que la app procese los metadatos y disfruta!

Importante: Por motivos de seguridad del navegador, deberás "Cargar Carpeta" cada vez que abras o recargues la aplicación. La aplicación guardará tus ajustes y eventos del calendario en la memoria del navegador, pero no puede "recordar" el acceso a tu carpeta local.

----[ Tecnologías Utilizadas ]----

HTML5

Tailwind CSS (cargado desde CDN)

JavaScript (ES6+) (Todo el código de la aplicación)

jsmediatags: Para leer los metadatos ID3 de los archivos de audio.

ion-icons: Para todos los iconos de la interfaz.

Web Audio API: Para el Ecualizador (EQ) y el Visualizador de Audio.

LocalStorage API: Para la persistencia de datos.