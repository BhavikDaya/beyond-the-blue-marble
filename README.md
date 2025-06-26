# *Beyond the Blue Marble*

Explore the wonders of the solar system beyond the blue marble in your browser! Beyond the Blue Marble is an interactive and educational 3D solar system simulation built with Three.js. 

## *Features*

- ### *An Immersive Experience of our Solar System*
    - *Explore* planets, major moons, dwarf planets and asteroids with vibrant textures and accurate orbits.
    - *Control* their orbital mechanics and observe the dynamic shadows. 
    - *View* dynamic shadows from up close.
    - *Asteroid and Kuiper Belts* are free for you to explore.

- ### *Interactive Controls*
    - *Click to explore* any celestial object you see on the screen or select from the sidebar. 
    - *Cinematic* camera transitions and tracking.
    - *Control* the orbital speeds and pause/play the animations.
    - *Toggle* the visibility of the orbital trails.
    - *Click* empty space to stop tracking a celestial body.

- ### *Free Roam Mode*
    -  *Take control* of your own spaceship and view the solar system from with first-person perspective.
    - * Full* keyboard controls.
    - *Camera shake* adds realism to the experience. 

- ### *Educational Content*
    - *Detailed* information panels about each celestial body.
    - *Real* data about their physical properties.
    - *Fun facts* about each object you click on. 

## *Controls*

- ### *Navigation*
    - *Orbit* the camera around each body you click one. 
    - *Watch* as the camera smoothly transitions and follows each object that you click on. 
    - *Click* on empty space to stop tracking an object.
    - *Zoom* in and out with the scroll wheel when not following a celestial body. 
    - *Expand* the side bar to show the celestial bodies and left click on them to learn about them.

- ### *Free Roam Mode*
    - *WASD* for cardinal movements.
    - *Arrow up/down* to ascend or descend.
    - *Right or left arrow* to turn.
    - *Q/E* to roll left or right.

- ### *UI Controls*
    - *Play/Pause:* Stop/start orbital animations.
    - *Speed Slider:* Adjust simulation speed.
    - *Trails Toggle:* Show/hide orbital paths.
    - *Enter/Exit Freeroam:* Switch between navigation and cockpit modes.
    - *Sidebar:* Quick navigation to any celestial body.

## - *Technical Features*

 - ### *Performance Optimisations*
    - *Level of Detail (LOD):* Dynamic geometry complexity based on camera distance.
    - *Texture caching:* Efficient texture loading and memory management.
    - *Frame rate limiting:* Maintains smooth 60 FPS performance.
    - *Memory management:* Proper disposal of resources to prevent memory leaks.

- ### *Graphics*
    - *Shadow mapping:* Dynamic shadows from the sun.
    - *Atmospheric effects:* Glowing atmospheres and corona effects.
    - *Ring systems:* Detailed planetary ring rendering.
    - *Particle systems:* Starfield background generation.

## *Celestial Bodies*

 - ### *Stars*
    - Our sun.
    - The background star field.

 - ### *Planets*
    - Mercury.
    - Venus.
    - Earth.
    - Mars.
    - Jupiter.
    - Saturn.
    - Uranus.
    - Neptune.

 - ### *Moons*
    - Earth's moon.
    - Phobos and Deimos.
    - Callisto, Europa, Ganymede and Io.
    - Enceladus, Mimas and Titan.
    - Triton.
    - Titania.
    - The five moons of Pluto.

 - ### *Dwarf Planets (and candidates)*
    - Ceres.
    - Pluto.
    - Eris.
    - Orcus.
    - Haumea.
    - Sedna.
    - Gonggong.
    - FarFarOut.

 - ### *Artificial Objects*
    - The ISS.

## *Requirements*

 - ### *Javascript*
    - Three.js.
    - Orbit Controls.
    - Object Loader.

## *File Structure*

beyond-the-blue-marble/
├── index.html              # Main HTML file
├── script.js               # Main JavaScript application
├── styles.css              # Styling
├── celestialDB.json        # Celestial body data
├── images/                 # Texture files
│   ├── planets/
│   ├── moons/
│   ├── atmosphere/
│   └── rings/
├── models/                 # 3D model files
│   ├── spaceship.obj
│   └── comet.obj
└── sounds/                 # Audio files
    └── background.mp3

## *Browser Support*

    - Chrome, Firefox, Edge and Safari haev full support. 
    - Compatible with mobile.

## *System Requirements*

    - Modern web browser with WebGL support.
    - Minimum 4GB RAM recommended.
    - Dedicated graphics card recommended for best performance.
    - Stable internet connection for loading assets.

## *Future Enhancements*

    - Exoplanet systems: Explore planets beyond our solar system.
    - Spacecraft missions: Historical and future space missions.
    - Real-time data: Live astronomical data integration.
    - Multi-language support: Accessibility for global users.

## *Limitations*

    - Simplified orbits (circular). 
    - Scale compromises: Sizes and distances are not to perfect scale for visibility.
    - Large scenes may impact performance on older hardware.

## *License*
    - This project is open source and available under the MIT License.

## *Credits*

- ### *Images*
    - Textures for the Sun, Mercury, Earth, the Moon, Mars, Saturn, all planetary rings, atmospheres, the corona, Uranus and Neptune were generated using Google's Gemini.
    - Venus texture: [Venus atmosphere](https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg).
    - Phobos, Deimos, Europa and Triton textures: Hand drawn on an iPad using Procreate.
    - Ceres texture: [Ceres](https://www.solarsystemscope.com/textures/download/2k_ceres_fictional.jpg).
    - Jupiter texture: Generated with Google's Gemini and the Great Red Spot was added in Procreate. 
    - Callisto texture: [Callisto](https://paulbourke.net/texturelibrary/displayimage.cgi?space/callisto.jpg).
    - Ganymede texture: [Ganymede](https://commons.wikimedia.org/wiki/File:Ganymede_map_by_Askaniy.png).
    - Io texture: [Io](https://www.nasa.gov/wp-content/uploads/2023/03/174427main_image_feature_804_ys_ful.jpg).
    - Titan texture: [Titan](https://www.nasa.gov/wp-content/uploads/2023/03/pia20016.jpg).
    - Titania texture: [Titania](https://en.wikipedia.org/wiki/Titania_%28moon%29#/media/File:Titania_(moon)_color,_cropped.jpg).
    - Pluto texture: [Pluto surface](https://science.nasa.gov/resource/close-up-of-plutos-surface/).
    - Eris texture: [Eris](https://pixabay.com/photos/map-eris-planet-world-rock-4818830/).
    - Sedna texture: [Sedna](https://www.deviantart.com/whothflukeisuranus/art/Sedna-Texture-1084551761).

- ### *3D Models*
    - Comet model: [Asteroid](https://s3.amazonaws.com/files.free3d.com/models/123d/printable_catalog/10464_Asteroid_L3.123c72035d71-abea-4a34-9131-5e9eeeffadcb.zip?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5DEPHINMSI4OS3OO%2F20250618%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250618T182303Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Signature=acfd3c1fb4c65331b1c1061cd3931893c891b9430426cd89edca2dd882f4791d).
    - Rocket model: [Rocket](https://s3.amazonaws.com/files.free3d.com/models/123d/printable_catalog/Rocket_Ship_v1_L3.123c485c9e1d-6d02-47cf-b751-9606e55c8fa1.zip?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5DEPHINMSI4OS3OO%2F20250618%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250618T142924Z&X-Amz-SignedHeaders=host&X-Amz-Expires=1200&X-Amz-Signature=b8edc385ad7c7dd7d2cd4e392b24ee5677d93eca134dbec45487a8b30c0e16cb).
    - Spaceship model: 

- ### *Sounds*
    - Background music: [Calm space music](https://cdn.pixabay.com/download/audio/2025/03/11/audio_03e017e1e5.mp3?filename=calm-space-music-312291.mp3).


## *Assistance*

    - Portions of the code structure and logic were guided by help from chatGPT (OpenAI) and Claude (Anthropic). 
    - Additionally, textures mentioned above were generated with help from Gemini (Google).
    - Specific help included assistance with Three.js, camera and scene setup, camera transitions, ship movements and mesh rendering. 
    - All code was written and understood by me with use of the above AI tools for learning, understanding and clarification. 