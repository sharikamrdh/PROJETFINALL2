// Définition du VHSPipeline
class VHSPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'VHS',
            fragShader: `
            precision mediump float;
 
 
            uniform sampler2D uMainSampler;
            uniform vec2 uResolution;
            uniform float uTime;
 
 
            varying vec2 outTexCoord;
 
 
            float hash(float n) { return fract(sin(n) * 43758.5453123); }
 
 
            float noise(vec2 x){
                vec2 p = floor(x);
                vec2 f = fract(x);
                f = f*f*(3.0-2.0*f);
                float n = p.x + p.y*57.0;
                float res = mix(mix(hash(n+0.0), hash(n+1.0),f.x),
                                mix(hash(n+57.0), hash(n+58.0),f.x),f.y);
                return res;
            }
 
 
            void main(void) {
                vec2 uv = outTexCoord;
                vec3 texColor = texture2D(uMainSampler, uv).rgb;
 
 
                float t = uTime;
 
 
                // Ajouter du bruit
                float y = floor(uv.y * uResolution.y);
                float n = noise(vec2(0.0, y * 0.01 + t * 5.0)) * 0.5 + 0.5;
 
 
                texColor.rgb *= n;
 
 
                // Ajouter des lignes de balayage
                float scanline = sin(uv.y * uResolution.y * 0.5) * 0.04;
                texColor.rgb -= scanline;
 
 
                gl_FragColor = vec4(texColor, 1.0);
            }
            `
        });
    }
 
 
    onPreRender() {
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
    }
 }


// Définition du RGBShiftPipeline
class RGBShiftPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'RGBShift',
            fragShader: `
            precision mediump float;

            uniform sampler2D uMainSampler;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform float uAmount;
            varying vec2 outTexCoord;

            void main(void) {
                vec2 uv = outTexCoord;
    
                // Réduire la distance entre les canaux et ralentir les rotations
                vec2 offset = uAmount * vec2(sin(uTime * 0.3), cos(uTime * 0.3)) / uResolution;

                // Ajuster les décalages pour chaque canal de couleur
                float r = texture2D(uMainSampler, uv + offset * 0.2).r; // Moins de décalage pour le rouge
                float g = texture2D(uMainSampler, uv).g; // Le vert reste au centre
                float b = texture2D(uMainSampler, uv - offset * 0.3).b; // Moins de décalage pour le bleu

                gl_FragColor = vec4(r, g, b, 1.0);
            }
            `

        });
    }

    onPreRender() {
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
    
        // Obtenir la santé mentale actuelle depuis le registry global
        let mentalHealth = this.game.registry.get('mentalHealth') || 100;
        // Calculer l'intensité de l'effet en fonction de la santé mentale
        let intensity = Phaser.Math.Clamp((35 - mentalHealth) / 35, 0, 1) * 10.0; // Ajustez le facteur si nécessaire
        this.set1f('uAmount', 50.0);
    }
    
}

// Fonction pour afficher le guide
function showGuide() {
    const guide = document.getElementById('gameGuide');
    guide.classList.add('active');
}

// Fonction pour masquer le guide
function hideGuide() {
    const guide = document.getElementById('gameGuide');
    guide.classList.remove('active');
}

// Ajouter un écouteur d'événement pour fermer le guide
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('closeGuide');
    if (closeButton) {
        closeButton.addEventListener('click', hideGuide);
    }
});

// Main Menu Scene
class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        // Charger l'audio pour la bande sonore
        this.load.audio('mainMenuSoundtrack', 'assets/Layers Of Fear Soundtrack - Main Theme (feat. Penelopa Wilmann-Szynalik).mp3');
        this.load.audio('Hospital', 'assets/Abandoned Hospital Corridor  Lights, Wind, EKG Machine  15 Minutes of Ambience.mp3');
        this.load.audio('inheritanceSound', 'assets/🔥 FIREPLACE (10 MINUTES) - Relaxing Fire Burning Video & Crackling Fireplace Sounds.mp3');
        this.load.audio('rainSound', 'assets/Rain Sounds for Sleeping 10 Minutes   Rain Ambiance for Relaxing and Study ASMR Nature Sounds ☔️💦💤.mp3');
        
        // Charger la vidéo d'introduction
        //this.load.video('introVideo', 'assets/intro.mp4');
    }

    create() {

        // Ajouter un écouteur d'événement pour le bouton de fermeture du guide
        const closeButton = document.getElementById('closeGuide');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hideGuide());
        } else {
            console.error('Élément #closeGuide non trouvé dans le DOM.');
        }

        this.registry.set('inventory', []); // Initialisation globale de l'inventaire
        /*
        // Ajouter et lire la vidéo en arrière-plan
        const video = this.add.video(0, 0, 'introVideo');
        video.setOrigin(0, 0); // Positionner en haut à gauche
        video.setDisplaySize(this.cameras.main.width, this.cameras.main.height); // Adapter à la taille de l'écran
        video.play(true); // Lire en boucle
        video.setMute(true); // Désactiver le son de la vidéo
        video.setDepth(-1); // Mettre la vidéo à l'arrière-plan

        // Ajuster la vidéo à la taille de la fenêtre
        window.addEventListener('resize', () => {
            video.setDisplaySize(this.scale.width, this.scale.height);
        });
        
        */
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
      
        const title = this.add.text(centerX, 100, 'The Hollow Reflection', { fontSize: '32px', fill: '#fff' });
        title.setOrigin(0.5);
      
        const newGameText = this.add.text(centerX, centerY - 50, 'New Game', { fontSize: '24px', fill: '#fff' });
        newGameText.setOrigin(0.5);
        newGameText.setInteractive();
        newGameText.on('pointerdown', () => this.startNewGame(), this);
      
        const exitText = this.add.text(centerX, centerY, 'Exit', { fontSize: '24px', fill: '#fff' });
        exitText.setOrigin(0.5);
        exitText.setInteractive();
        exitText.on('pointerdown', () => this.exitGame(), this);
      
        const settingsText = this.add.text(centerX, centerY + 50, 'Paramètres', { fontSize: '24px', fill: '#fff' });
        settingsText.setOrigin(0.5);
        settingsText.setInteractive();
        settingsText.on('pointerdown', () => this.openSettings(), this);
      
        const règleduJeu = this.add.text(centerX, centerY + 100, 'Guide du jeu', { fontSize: '24px', fill: '#fff' });
        règleduJeu.setOrigin(0.5);
        règleduJeu.setInteractive();
        règleduJeu.on('pointerdown', () => this.regleJeu(), this);
      
        const son = this.add.text(centerX, 600, 'Clique ici pour activer le son', { fontSize: '20px', fill: '#fff' });
        son.setOrigin(0.5);
      
        // Lancer la bande sonore en boucle
        this.sound.add('mainMenuSoundtrack', { loop: true, volume: 1 }).play();
      
        // Appliquer l'effet VHS à la caméra
        this.cameras.main.setPostPipeline('VHS');
    }

    startNewGame() {
        this.sound.stopAll(); // Arrêter la bande sonore lorsqu'on commence le jeu
        this.scene.start('IntroScene');
    }

    exitGame() {
        console.log('Quitter le jeu');
    }

    openSettings() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;


        // Créer une fenêtre semi-transparente
        const settingsWindow = this.add.rectangle(centerX, centerY, 300, 200, 0x000000, 0.8);
        settingsWindow.setOrigin(0.5);

        // Ajouter un texte pour le titre des paramètres
        const settingsTitle = this.add.text(centerX, centerY - 70, 'Paramètres', { 
            fontSize: '24px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        // Dessiner un logo sonore
        const soundIcon = this.add.graphics({ x: centerX - 50, y: centerY });
        soundIcon.fillStyle(0xffffff, 1); // Couleur blanche
        soundIcon.fillRect(-20, -10, 20, 20); // Base du haut-parleur
        soundIcon.fillTriangle(-20, -10, -20, 10, -35, 0); // Triangle du haut-parleur
        soundIcon.lineStyle(2, 0xffffff, 1); // Couleur et épaisseur des ondes sonores
        soundIcon.strokeCircle(10, 0, 10); // Petite onde
        soundIcon.strokeCircle(15, 0, 15); // Grande onde

        // Ajouter un texte pour afficher l'état du son
        const soundStatus = this.add.text(centerX + 20, centerY, 'On', { 
            fontSize: '20px', 
            fill: '#fff' 
        }).setOrigin(0.5);

        // Définir l'état initial du son
        let isSoundOn = true;

        // Rendre le logo interactif
        soundIcon.setInteractive(new Phaser.Geom.Rectangle(-35, -15, 50, 30), Phaser.Geom.Rectangle.Contains);
        soundIcon.on('pointerdown', () => {
            isSoundOn = !isSoundOn;
            this.sound.setMute(!isSoundOn);
            soundStatus.setText(isSoundOn ? 'On' : 'Off');
        });

        // Ajouter un bouton pour fermer la fenêtre de paramètres
        const closeButton = this.add.text(centerX, centerY + 80, 'Fermer', { 
            fontSize: '20px', 
            fill: '#fff', 
            backgroundColor: '#333' 
        }).setOrigin(0.5).setInteractive();

        closeButton.on('pointerdown', () => {
            // Supprimer tous les éléments de la fenêtre de paramètres
            settingsWindow.destroy();
            settingsTitle.destroy();
            soundIcon.destroy();
            soundStatus.destroy();
            closeButton.destroy();
        });
        
    }


    regleJeu(){
        // Appeler la méthode showGuide pour afficher le guide
        this.showGuide();
    }

    showGuide() {
        const guide = document.getElementById('gameGuide');
        if (guide) {
            guide.classList.add('active');
        } else {
            console.error('Élément #gameGuide non trouvé dans le DOM.');
        }
    }

    hideGuide() {
        const guide = document.getElementById('gameGuide');
        if (guide) {
            guide.classList.remove('active');
        } else {
            console.error('Élément #gameGuide non trouvé dans le DOM.');
        }
    }
}



// Nouvelle scène d'intro pour afficher "Octobre 2024"
class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000'); // Fond noir

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Texte pour afficher "Octobre 2024" avec une animation de fade up
        this.introText = this.add.text(centerX, centerY + 50, 'Octobre 2024', {
            fontSize: '48px',
            fill: '#ffffff'
        });
        this.introText.setOrigin(0.5);
        this.introText.setAlpha(0); // Rendre le texte invisible au départ
        this.introText.y += 50; // Commence un peu plus bas pour l'effet de montée

        // Animation de fade up pour le texte
        this.tweens.add({
            targets: this.introText,
            alpha: 1, // Faire apparaître le texte
            y: centerY, // Déplacer le texte vers le haut
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                // Attendre un moment avant de déclencher le fade out
                this.time.delayedCall(2000, () => {
                    this.fadeOutScene(); // Déclencher le fondu en sortie
                });
            }
        });
    }

    fadeOutScene() {
        // Créer un fondu en sortie en réduisant l'alpha de la caméra
        this.cameras.main.fadeOut(2000, 0, 0, 0); // Durée de 2000ms pour le fade out

        // Quand le fondu est terminé, passer à la scène suivante
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('HospitalScene'); // Passer à la scène de l'hôpital
        });
    }
}

/*
fetch('http://127.0.0.1:5000/evenement', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    } 
})
.then(response => {
    if (!response.ok) {
        throw new Error("Erreur réseau");
    } 
    return response.json();
})
.then(data => {
    console.log("Événement aléatoire déclenché :", data.message);
})
.catch(err => console.error('Erreur lors du déclenchement d\'un événement aléatoire :', err));
*/

// Ajoutez cette classe avant la définition de vos scènes
class MentalHealthBar {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxValue = 100;
        //this.lowMentalHealthSound = null;
        this.imageTweens = []; // Initialiser imageTweens ici

        // Créer l'objet graphique pour la barre
        this.graphics = this.scene.add.graphics();
        this.graphics.setDepth(1000);

        // Récupérer la valeur initiale de santé mentale
        this.value = this.scene.registry.get('mentalHealth') || 100;
        this.displayedValue = this.value;

        // Charger et configurer le son de faible santé mentale
        //this.lowMentalHealthSound = this.scene.sound.add('lowMentalHealthSound', { loop: true, volume: 0.5 });

        // Ajouter le texte pour afficher la valeur
        this.valueText = this.scene.add.text(
            this.x + this.width / 2,
            this.y + this.height + 5,
            `${this.value}`,
            { font: '16px Arial', fill: '#ffffff' }
        );
        this.valueText.setOrigin(0.5, 0);
        this.valueText.setDepth(1000);

        // Dessiner la barre initiale
        this.draw();
        this.startMentalHealthDecay(); // Lancement de la gestion automatique
        this.checkMentalHealthEffects(); // Vérification initiale
    }

    // Nouvelle méthode pour déclencher un événement aléatoire
    triggerRandomEvent() {
        fetch('http://127.0.0.1:5000/evenement', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log("Événement aléatoire déclenché :", data.message);
            this.scene.registry.set('mentalHealth', data.game_state.sante_mentale);
            this.setValue(data.game_state.sante_mentale);
        })
        .catch(err => console.error('Erreur lors du déclenchement d\'un événement aléatoire :', err));
    }

    // Nouvelle méthode pour gérer la diminution automatique
    startMentalHealthDecay() {
        this.scene.time.addEvent({
            delay: 10000, // Toutes les 10 secondes
            callback: () => {
                // Réduire la santé mentale via l'API Flask
                fetch('http://127.0.0.1:5000/gerer_temps', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                    this.scene.registry.set('mentalHealth', data.game_state.sante_mentale);
                    this.setValue(data.game_state.sante_mentale);
                })
                .catch(err => console.error('Erreur lors de la gestion du temps :', err));
            },
            loop: true
        });
    }
    

    setValue(value) {
        const newValue = Phaser.Math.Clamp(value, 0, this.maxValue);

        // Mettre à jour la valeur réelle
        this.value = newValue;
        this.scene.registry.set('mentalHealth', this.value);

        // Si une animation est déjà en cours, l'arrêter
        if (this.tween) {
            this.tween.stop();
        }

        // Créer une animation pour la valeur affichée
        this.tween = this.scene.tweens.add({
            targets: this,
            displayedValue: newValue,
            duration: 1000, // Durée de l'animation en millisecondes
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                this.draw(); // Mettre à jour le dessin pendant l'animation
            },
            onComplete: () => {
                this.tween = null; // Nettoyer la référence à l'animation
            }
        });
        
        if (this.scene.key === 'HouseScene' && this.value <= 35) {
            if (this.scene.cameras.main.postFX && !this.scene.cameras.main.postFX.hasPostPipeline('RGBShift')) {
                this.scene.cameras.main.setPostPipeline('RGBShift');
            }
        } else {
            if (this.scene.cameras.main.postFX && this.scene.cameras.main.postFX.hasPostPipeline('RGBShift')) {
                this.scene.cameras.main.postFX.removePostPipeline('RGBShift');
            }
        }
        

        // Vérifiez si des effets doivent être appliqués
        this.checkMentalHealthEffects();
    }

    checkMentalHealthEffects() {
        if (this.value <= 35) {
            //if (!this.lowMentalHealthSound.isPlaying) {
                //this.lowMentalHealthSound.play();
            //}
            this.applyViolentPulsationToImages(); // Activer la pulsation violente
            this.applyRGBShiftEffect(); // Appliquer l'effet RGB
    
            // Gérer les hallucinations (appel à une API Flask)
            fetch('http://127.0.0.1:5000/evenement', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                console.log("Événement aléatoire déclenché :", data.message);
                this.scene.registry.set('mentalHealth', data.game_state.sante_mentale);
                this.setValue(data.game_state.sante_mentale);
            })
            .catch(err => console.error('Erreur lors du déclenchement des hallucinations :', err));
        } else {
            //if (this.lowMentalHealthSound.isPlaying) {
                //this.lowMentalHealthSound.stop();
            //}
            this.removeViolentPulsationFromImages(); // Désactiver la pulsation violente
            this.removeRGBShiftEffect(); // Supprimer l'effet RGB
        }
    }
    

    applyViolentPulsationToImages() {
        // Vérifier si imageTweens est bien initialisé et contient des éléments
        if (!this.imageTweens || this.imageTweens.length > 0) {
            return; // Éviter de recréer des tweens
        }
    
        // Récupérer toutes les images de la scène
        const images = this.scene.children.list.filter(child => 
            child instanceof Phaser.GameObjects.Image &&
            !this.scene.inventory.slots.some(slot => slot.itemImage === child) // Exclure les images de l'inventaire
        );
    
        images.forEach(image => {
            // Pulsation avec la même échelle que le code initial
            const scaleTween = this.scene.tweens.add({
                targets: image,
                scale: { from: 1, to: 1.05 }, // Échelle de pulsation
                duration: 1000, // Durée de chaque pulsation
                yoyo: true,
                repeat: -1, // Répéter indéfiniment
                ease: 'Sine.easeInOut'
            });
    
            this.imageTweens.push(scaleTween); // Ajouter le tween à la liste pour le gérer plus tard
    
            // Ajouter un tween pour le mouvement oscillant
            const oscillationTween = this.scene.tweens.add({
                targets: image,
                x: { from: image.x - 50, to: image.x + 50 }, // Oscillation de gauche à droite
                duration: 1500, // Durée de l'oscillation
                yoyo: true,
                repeat: -1, // Répéter indéfiniment
                ease: 'Sine.easeInOut' // Oscillation fluide
            });
            this.imageTweens.push(scaleTween, oscillationTween); // Stocker les tweens
        });
    }
    
    

    removeViolentPulsationFromImages() {
        if (!this.imageTweens || this.imageTweens.length === 0) {
            return; // Aucun tween à arrêter
        }
    
        this.imageTweens.forEach(tween => tween.stop()); // Arrêter tous les tweens
        this.imageTweens = [];
    
        // Réinitialiser l'échelle des images
        const images = this.scene.children.list.filter(child => child instanceof Phaser.GameObjects.Image);
        images.forEach(image => {
            image.setScale(1); // Réinitialiser l'échelle
        });
    }
    
    

    applyRGBShiftEffect() {
        if (this.value <= 35) {
            console.log("Effet RGB appliqué !");
            if (this.scene.cameras.main.postFX && !this.scene.cameras.main.postFX.hasPostPipeline('RGBShift')) {
                this.scene.cameras.main.postFX.addPostPipeline('RGBShift');
            }
        }
    }    

    removeRGBShiftEffect() {
        if (this.scene.cameras.main.postFX && this.scene.cameras.main.postFX.hasPostPipeline('RGBShift')) {
            this.scene.cameras.main.postFX.removePostPipeline('RGBShift');
        }
    }

    draw() {
        // Effacer les dessins précédents
        this.graphics.clear();

        // Dessiner le fond de la barre (rouge)
        this.graphics.fillStyle(0xFF0000, 1);
        this.graphics.fillRect(this.x, this.y, this.width, this.height);

        // Calculer la hauteur de la barre en fonction de la valeur affichée
        const healthHeight = (this.displayedValue / this.maxValue) * this.height;

        // Dessiner la barre de santé mentale (vert)
        this.graphics.fillStyle(0x004200, 1);
        this.graphics.fillRect(
            this.x,
            this.y + (this.height - healthHeight),
            this.width,
            healthHeight
        );

        // Mettre à jour le texte de la valeur
        this.valueText.setText(`${Math.round(this.displayedValue)}`);
    }
}

// Modifier la classe Inventory pour ajouter un événement de clic sur la case contenant la "note"
class Inventory {
    constructor(scene) {
        this.scene = scene;
        this.slots = [];
        this.maxSlots = 5; // Nombre maximum de slots d'inventaire
        this.slotSize = 64; // Taille des cases en pixels
        this.margin = 10; // Espace entre les cases
        this.startX = 20; // Position X du premier slot
        this.startY = 20; // Position Y du premier slot
        this.items = []; // Liste des objets dans l'inventaire

        this.createSlots();
    }

    createSlots() {
        for (let i = 0; i < this.maxSlots; i++) {
            const x = this.startX;
            const y = this.startY + i * (this.slotSize + this.margin);
            const slot = this.scene.add.rectangle(x, y, this.slotSize, this.slotSize, 0x000000, 0.5);
            slot.setOrigin(0, 0);
            slot.setDepth(1000); // Assurez-vous que les cases sont toujours au-dessus
            this.slots.push(slot);
        }
    }

    updateInventory(newItems) {
        this.items = newItems;

        // Réinitialisez les slots
        this.slots.forEach((slot) => {
            if (slot.itemImage) {
                slot.itemImage.destroy();
                slot.itemImage = null;
            }
        });

        // Associez chaque objet à un slot
        this.items.forEach((itemName, index) => {
            if (index < this.slots.length) {
                const slot = this.slots[index];
                const itemImage = this.scene.add.image(
                    slot.x + this.slotSize / 2,
                    slot.y + this.slotSize / 2,
                    itemName
                );
                itemImage.setDisplaySize(this.slotSize - 10, this.slotSize - 10);
                itemImage.setDepth(1001);
                slot.itemImage = itemImage;

                // Ajouter un événement de clic pour les notes
                if (itemName === "Note") {
                    itemImage.setInteractive();
                    itemImage.on('pointerdown', () => {
                        this.scene.showNote(); // Appeler une méthode de la scène pour afficher la note
                    });
                }
            }
        });
    }
}


function initializeInventory(scene) {
    const currentInventory = scene.registry.get('inventory') || [];
    scene.inventory = new Inventory(scene); // Créez les slots d'inventaire
    scene.inventory.updateInventory(currentInventory);

    // Assurez-vous que les slots et les objets sont toujours au-dessus
    scene.inventory.slots.forEach(slot => {
        slot.setDepth(1000);
        if (slot.itemImage) {
            slot.itemImage.setDepth(1001);
        }
    });
}


// Exemple d'utilisation dans une scène Phaser
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Charger les images des objets
        this.load.image('Clé', 'assets/key-removebg-preview.png');
        this.load.image('Note', 'assets/letter-removebg.png');
        this.load.image('Pistolet', 'assets/gun.png');
        
    }

    create() {
        // Initialiser l'inventaire
        this.inventory = new Inventory(this);

        // Charger l'inventaire initial depuis le serveur
        this.loadInventory();

        // Exemple de clic pour mettre à jour l'inventaire
        this.input.keyboard.on('keydown-I', () => {
            this.loadInventory();
        });
    }

    async loadInventory() {
        try {
            const response = await fetch('http://127.0.0.1:5000/carte_objets');
            const data = await response.json();
            this.inventory.updateInventory(data.objets);
            this.registry.set('inventory', data.objets);
        } catch (error) {
            console.error("Erreur lors du chargement de l'inventaire :", error);
        }
    }    

    async ramasserObjet(nomObjet, objetImage) {
        try {
            const response = await fetch('http://127.0.0.1:5000/ramasser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: objetImage.x, y: objetImage.y, tolerance: 20 })
            });

            const data = await response.json();

            if (response.ok && data.message.includes('ramassé')) {
                console.log(`${nomObjet} ramassé !`);
                objetImage.destroy(); // Supprimez l'objet visuel
                this.inventory.updateInventory(data.game_state.inventaire); // Mettez à jour l'inventaire
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Erreur lors du ramassage :', error);
        }
    }
}


 
// Hospital Scene avec animations d'images et bouton "Next" pour les dialogues
class HospitalScene extends Phaser.Scene {
    constructor() {
        super('HospitalScene');
    }

    preload() {
        // Charger les images de l'hôpital
        this.load.image('hospitalClosedDoor', 'assets/1.jpg'); // Remplacez par le chemin correct
        this.load.image('hospitalOpenDoor', 'assets/2.jpg'); // Remplacez par le chemin correct

        this.load.image('Clé', 'assets/key-removebg-preview.png');
        this.load.image('Note', 'assets/letter-removebg.png');

        // Charger l'image inheritance
        this.load.image('inheritanceImage', 'assets/letter.jpg');
        this.load.image('voiture2', 'assets/voiture3.png');

        //this.load.audio('lowMentalHealthSound', 'assets/Hearing Voices Simulation 30min.mp3');
        
    }

    create() {
        // Appliquer un effet de fondu en entrée pour l'écran
        this.cameras.main.fadeIn(1000, 0, 0, 0); // Durée de 2000 ms pour le fade in, couleur noire

        // Initialiser l'inventaire
        this.inventory = new Inventory(this);

        // Charger l'inventaire initial depuis le serveur
        this.loadInventory();

        // Exemple : mettre à jour l'inventaire avec la touche "I"
        this.input.keyboard.on('keydown-I', () => {
            this.loadInventory();
        });

        this.registry.set('inventory', []); // Initialiser l'inventaire global

        // Charger l'inventaire actuel
        let currentInventory = this.registry.get('inventory') || [];

        // Supprimer la clé si elle est présente dans l'inventaire
        currentInventory = currentInventory.filter(item => item !== 'Clé');
        this.registry.set('inventory', currentInventory);

        // Initialiser l'inventaire visuel
        this.inventory = new Inventory(this);
        this.inventory.updateInventory(currentInventory);

        initializeInventory(this);

        this.inventory.slots.forEach(slot => {
            slot.setDepth(1000);
            if (slot.itemImage) {
                slot.itemImage.setDepth(1001);
            }
        });

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Ajouter l'image de la porte fermée au centre de l'écran
        this.hospitalImage = this.add.image(centerX, centerY, 'hospitalClosedDoor');
        this.hospitalImage.setOrigin(0.5, 0.5);

        // Ajouter un effet de pulsation à l'image de la porte
        this.tweens.add({
            targets: this.hospitalImage,
            scale: { from: 1, to: 1.05 },
            duration: 10000,
            yoyo: true,
            repeat: -1
        });

        // Ajouter une animation de déplacement horizontal pour l'image de la porte
        this.tweens.add({
            targets: this.hospitalImage,
            x: { from: centerX - 10, to: centerX + 10 },
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Ajouter un texte d'instruction visible directement, initialement invisible
        this.instructionText = this.add.text(centerX, centerY - 350, "Appuyer sur la porte", {
            font: "16px Arial",
            fill: "#ffffff",
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.instructionText.setAlpha(0); // Rendre le texte invisible au départ

        // Animation "fade-in" pour le texte
        this.tweens.add({
            targets: this.instructionText,
            alpha: 1, // Passer de transparent à opaque
            duration: 2000, // Durée de l'animation (en ms)
            ease: 'Power2',
            onComplete: () => {
                // Lancer l'animation "flash" une fois le fade-in terminé
                this.tweens.add({
                    targets: this.instructionText,
                    alpha: { from: 1, to: 0 }, // Alterner entre visible et invisible
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        // Lancer la bande sonore en boucle
        this.sound.add('Hospital', { loop: true, volume: 1 }).play();

        // Créer un texte pour indiquer "PORTE"
        this.hoverText = this.add.text(centerX, centerY - 150, "PORTE", {
            font: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        // Définir la zone interactive de la porte
        const porteWidth = 300; // largeur de la porte en pixels
        const porteHeight = 500; // hauteur de la porte en pixels
        const porteX = centerX; // position X de la porte
        const porteY = centerY + 50; // position Y de la porte

        // Créer une zone interactive sur la porte
        this.porteZone = this.add.zone(porteX, porteY, porteWidth, porteHeight);
        this.porteZone.setOrigin(0.5, 0.5);
        this.porteZone.setInteractive({ useHandCursor: true });

        // Événements de survol
        this.porteZone.on('pointerover', () => {
            this.hoverText.setVisible(true); // Afficher le texte "PORTE"
        });

        this.porteZone.on('pointerout', () => {
            this.hoverText.setVisible(false); // Cacher le texte lorsque la souris quitte la zone
        });

        // Clic pour ouvrir/fermer la porte
        this.porteZone.on('pointerdown', () => {
            this.toggleDoor(); // Bascule l'état de la porte
        });

        // Événements de survol
        this.porteZone.on('pointerover', () => {
            if (this.hospitalImage.texture.key === 'hospitalClosedDoor') {
                this.hoverText.setVisible(true); // Afficher le texte "PORTE"
            }
        });

        this.porteZone.on('pointerout', () => {
            this.hoverText.setVisible(false); // Cacher le texte lorsque la souris quitte la zone
        });

        // Créer une boîte de dialogue
        this.dialogBox = this.add.rectangle(centerX, this.cameras.main.height - 100, 400, 100, 0x000000, 0.8);
        this.dialogBox.setOrigin(0.5);

        // Créer le texte de dialogue
        this.dialogText = this.add.text(centerX - 180, this.cameras.main.height - 120, "", {
            font: '16px Arial',
            fill: '#ffffff',
            wordWrap: { width: 360 }
        });

        // Créer un bouton "Next" avec un fond blanc et un texte noir
        this.nextButtonBackground = this.add.rectangle(centerX + 160, this.cameras.main.height - 70, 60, 30, 0xffffff);
        this.nextButtonText = this.add.text(centerX + 160, this.cameras.main.height - 70, "Next", {
            font: '16px Arial',
            fill: '#000000'
        }).setOrigin(0.5);

        // Rendre le bouton "Next" interactif
        this.nextButtonBackground.setInteractive({ useHandCursor: true });
        this.nextButtonBackground.on('pointerdown', () => this.showNextDialogue());

        // Regrouper le fond et le texte pour les rendre visibles ou invisibles ensemble
        this.nextButtonBackground.setVisible(false);
        this.nextButtonText.setVisible(false);

        // Afficher le premier dialogue
        this.currentDialogueIndex = 0;
        this.dialogues = [
            "Qu'est-ce que... où... où suis-je ?",
            "Okay, essaye de te calmer. Respire. Respire… Essaye de réfléchir.",
            "Comment... comment je suis arrivé ici ? La dernière chose dont je me souviens… c’est… c’est quoi déjà ?",
            "(Il ferme les yeux, essayant de se rappeler.)"
        ];
        this.showDialogue(this.dialogues[this.currentDialogueIndex]);

        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'ArrowUp') {
                if (this.hospitalImage.texture.key === 'hospitalOpenDoor' && this.currentDialogueIndex === this.dialogues.length) {
                    // Si l'image correspond à 'hospitalOpenDoor', on déclenche l'action
                    console.log("Conditions remplies. Appel de triggerFlashAndShowImage()");
                    this.triggerFlashAndShowImage();
                } else {
                    console.log("L'image actuelle n'est pas correcte pour cette action.");
                    // Texte pour "Appuyez sur Next"
                    // Texte pour "Appuyez sur Next" avec une bordure fine noire
                    this.nextText = this.add.text(centerX, centerY + 200, "Terminer les dialogues. Appuyez sur Next", {
                        font: "16px Arial",
                        fill: "#ffffff", // Couleur du texte
                        stroke: "#000000", // Couleur de la bordure (noir)
                        strokeThickness: 2, // Épaisseur de la bordure
                        padding: { x: 10, y: 5 } // Espacement interne
                    }).setOrigin(0.5);


                    // Assurez-vous que ce texte est ignoré par la caméra principale
                    this.cameras.main.ignore(this.nextText);

                    // Ajoutez-le explicitement à la caméra UI
                    this.uiCamera.ignore([]);


                    // Faire disparaître le texte après 5 secondes
                    this.time.delayedCall(2000, () => {
                        if (this.nextText) {
                            this.nextText.destroy(); // Supprimer le texte "Appuyez sur Next"
                        }
                    });
                    
                }
            }
        });
        
        
        // Remplacez showNextDialogue pour inclure le flash et l'affichage de l'image
        this.showNextDialogue = () => {
            this.currentDialogueIndex++;
            if (this.currentDialogueIndex < this.dialogues.length) {
                this.showDialogue(this.dialogues[this.currentDialogueIndex]);
            } else {
                // Ne pas appeler triggerFlashAndShowImage automatiquement
                console.log("Appuyez sur la flèche avant pour continuer.");
                this.dialogBox.setVisible(false);
                this.dialogText.setVisible(false);
                this.nextButtonBackground.setVisible(false);
                this.nextButtonText.setVisible(false);
                
            }
        };        

        if (this.registry.get('mentalHealth') === undefined) {
            this.registry.set('mentalHealth', 100); // Initialiser la santé mentale à 100
        }

        // Créer la barre de santé mentale
        const barWidth = 20; // Largeur de la barre
        const barHeight = 200; // Hauteur maximale de la barre
        const barX = this.cameras.main.width - barWidth - 20; // Position X (20 pixels depuis le bord droit)
        const barY = 20; // Position Y (20 pixels depuis le haut)

        this.mentalHealthBar = new MentalHealthBar(this, barX, barY, barWidth, barHeight);

        const currentMentalHealth = this.registry.get('mentalHealth') || 100;
        const newMentalHealthValue = currentMentalHealth - 20; // Exemple de diminution
        this.mentalHealthBar.setValue(newMentalHealthValue);

        // Configuration de la caméra pour l'interface utilisateur
        this.uiCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.uiCamera.setName('UICamera');
        this.uiCamera.ignore([this.hospitalImage]); // Ignorer les éléments principaux de la scène

        // Ignorer la barre de santé mentale dans la caméra principale
        this.cameras.main.ignore(this.mentalHealthBar.graphics);

        this.cameras.main.ignore(this.hoverText); // Ignore le text 'PORTE'

        // Assurez-vous que la caméra principale n'ignore pas les éléments de la scène
        this.cameras.main.ignore([
            this.dialogBox,
            this.dialogText,
            this.nextButtonBackground,
            this.nextButtonText,
            this.mentalHealthBar.graphics,
            this.mentalHealthBar.valueText,
            this.instructionText,
            this.inventory
        ]);

        

    }

    async loadInventory() {
        try {
            const response = await fetch('http://127.0.0.1:5000/carte_objets');
            const data = await response.json();
    
            // Filtrer les objets pour s'assurer que "Clé" n'est pas ajouté
            const filteredItems = data.objets.filter(itemName => itemName !== 'Clé');
            this.inventory.updateInventory(filteredItems);
    
            // Mettre à jour le registre global
            this.registry.set('inventory', filteredItems);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'inventaire :', error);
        }
    }    

    triggerFlashAndShowImage() {
        // Créer un flash blanc
        this.cameras.main.flash(1000, 255, 255, 255); // Durée de 500 ms

        // Attendre la fin du flash pour afficher l'image
        this.time.delayedCall(0, () => {
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;

            // Afficher l'image inheritance2.png avec une transition progressive
            const inheritanceImage = this.add.image(centerX, centerY, 'inheritanceImage');
            inheritanceImage.setAlpha(0); // Rendre l'image invisible au départ

            this.tweens.add({
                targets: inheritanceImage,
                alpha: 1, // Faire apparaître l'image progressivement
                duration: 2000, // Durée de 2000 ms
                ease: 'Power2',
                onComplete: () => {
                    this.showInheritanceLetter(); // Afficher la lettre une fois l'image affichée
                }
            });
        });
    }

    showInheritanceLetter() {

        initializeInventory(this); // Initialisation de l'inventaire

        this.inventory.slots.forEach(slot => {
            slot.setDepth(1000);
            if (slot.itemImage) {
                slot.itemImage.setDepth(1001);
            }
        });

        this.registry.set('mentalHealth', 100);
        this.mentalHealthBar.setValue(100);

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
    
        // Récupérer la bande sonore actuelle
        const currentSound = this.sound.get('Hospital'); // Assurez-vous que 'Hospital' est bien la clé du son
    
        // Charger le nouveau son
        const newSound = this.sound.add('inheritanceSound', { loop: true, volume: 0 });
    
        // Diminuer le volume du son actuel progressivement
        this.tweens.add({
            targets: currentSound,
            volume: 0,
            duration: 2000, // Temps en ms pour réduire le volume
            onComplete: () => {
                currentSound.stop(); // Arrêter le son une fois le volume à 0
            }
        });
    
        // Augmenter le volume du nouveau son progressivement
        newSound.play();
        this.tweens.add({
            targets: newSound,
            volume: 1,
            duration: 2000 // Temps en ms pour augmenter le volume
        });
    
        // Créer un fond noir semi-transparent derrière la lettre
        const letterBackground = this.add.rectangle(
            centerX, centerY, 
            this.cameras.main.width * 0.6, // Largeur du fond (60% de la largeur de l'écran)
            this.cameras.main.height * 0.4, // Hauteur du fond (40% de la hauteur de l'écran)
            0x000000, 0.8 // Couleur noire avec une transparence de 80%
        );
        letterBackground.setOrigin(0.5);
        letterBackground.setAlpha(0); // Initialement invisible
    
        // Texte de la lettre
        const letterText = 
            "Cher [Nom du Personnage],\n\n" +
            "Nous avons le regret de vous informer du décès de votre oncle.\n" +
            "Dans son testament, il vous lègue une maison familiale.\n\n" +
            "Cependant, cet héritage est à partager avec votre cousin.\n" +
            "Vous devrez cohabiter pour en profiter pleinement.\n\n" +
            "Cordialement,\nLe notaire";
    
        // Ajouter le texte par-dessus le fond
        const letterContent = this.add.text(
            centerX - (this.cameras.main.width * 0.25), // Début légèrement à gauche du centre
            centerY - (this.cameras.main.height * 0.15), // Début légèrement au-dessus du centre
            letterText, 
            {
                font: '16px Arial',
                fill: '#ffffff', // Texte blanc
                wordWrap: { width: this.cameras.main.width * 0.5 } // Limiter la largeur du texte
            }
        );
        letterContent.setAlpha(0); // Initialement invisible
    
        // Animation pour faire apparaître lentement le fond et le texte
        this.tweens.add({
            targets: [letterBackground, letterContent],
            alpha: 1, // Faire apparaître les éléments
            duration: 2000, // Durée de 2000 ms
            ease: 'Power2'
        });
    
        // Bouton pour continuer
        const continueButton = this.add.text(
            centerX, centerY + (this.cameras.main.height * 0.2), 
            "Continuer", 
            {
                font: '18px Arial',
                fill: '#ffffff',
                backgroundColor: '#333333', // Bouton gris foncé
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setInteractive();
    
        continueButton.setAlpha(0); // Initialement invisible
    
        // Faire apparaître le bouton après l'animation de la lettre
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: continueButton,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
        });
    
        continueButton.on('pointerdown', () => {
            // Diminuer le volume de la bande sonore actuelle
            const currentSound = this.sound.get('inheritanceSound'); // Assurez-vous que la clé correspond
            const rainSound = this.sound.add('rainSound', { loop: true, volume: 0 }); // Bande sonore de pluie
        
            if (currentSound) {
                this.tweens.add({
                    targets: currentSound,
                    volume: 0,
                    duration: 2000, // Temps pour réduire le volume
                    onComplete: () => {
                        currentSound.stop(); // Arrêter la bande sonore actuelle
                        rainSound.play(); // Démarrer la nouvelle bande sonore
                        this.tweens.add({
                            targets: rainSound,
                            volume: 1,
                            duration: 2000 // Temps pour augmenter le volume de la pluie
                        });
                    }
                });
            } else {
                // Si aucun son actuel n'est actif, démarrez directement le son de pluie
                rainSound.play();
                this.tweens.add({
                    targets: rainSound,
                    volume: 1,
                    duration: 2000
                });
            }
        
            // Supprimer les éléments visuels
            letterBackground.destroy();
            letterContent.destroy();
            continueButton.destroy();
        
            // Créer un fondu noir
            this.cameras.main.fadeOut(1000, 0, 0, 0);
        
            // Passer à la scène suivante après le fondu
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('CarScene');
            });
        });
        
    }
    
    
    showDialogue(text) {
        this.dialogBox.setVisible(true);
        this.dialogText.setVisible(true);
        this.dialogText.setText(text);
        this.nextButtonBackground.setVisible(true); // Afficher le bouton "Next"
        this.nextButtonText.setVisible(true);
    }

    toggleDoor() {
        // Appliquer l'effet VHS à la caméra
        this.cameras.main.setPostPipeline('RGBShift');
        
        if (this.hospitalImage.texture.key === 'hospitalClosedDoor') {
            // Changer la texture pour l'image ouverte
            this.hospitalImage.setTexture('hospitalOpenDoor');

            // Supprimer ou cacher le texte "PORTE"
            this.hoverText.setVisible(false);

            // Réduire la santé mentale à 35
            this.mentalHealthBar.setValue(35);
    
            // Supprimer ou désactiver la zone interactive
            this.porteZone.destroy(); // Supprime complètement la zone interactive
    
            // Masquer le texte "Appuyer sur la porte" avec une animation fade-out
            this.tweens.add({
                targets: this.instructionText,
                alpha: 0, // Rendre le texte invisible
                duration: 1000, // Durée de l'animation (1 seconde)
                ease: 'Power2',
                onComplete: () => {
                    this.instructionText.destroy(); // Supprime le texte après l'animation
                }
            });
    
            // Ajouter le texte "Appuyez sur la flèche haut" avec des effets
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;
    
            this.arrowUpText = this.add.text(centerX, centerY - 350, "Appuyez sur la flèche haut pour continuer.", {
                font: "16px Arial",
                fill: "#ffffff",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            this.arrowUpText.setAlpha(0);

            // Assurez-vous que ce texte est ignoré par la caméra principale
            this.cameras.main.ignore(this.arrowUpText);

            // Ajoutez-le à la caméra UI pour qu'il reste visible sans effet
            this.uiCamera.ignore([]);
    
            // Effets d'animation pour le texte
            this.tweens.add({
                targets: this.arrowUpText,
                alpha: 1,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    this.tweens.add({
                        targets: this.arrowUpText,
                        alpha: { from: 1, to: 0 },
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
    
        } else {
            // Changer la texture pour l'image fermée
            this.hospitalImage.setTexture('hospitalClosedDoor');
    
            // Créer une nouvelle zone interactive pour la porte
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2 + 50;
            const porteWidth = 100; // Largeur de la porte
            const porteHeight = 200; // Hauteur de la porte
    
            this.porteZone = this.add.zone(centerX, centerY, porteWidth, porteHeight);
            this.porteZone.setOrigin(0.5, 0.5);
            this.porteZone.setInteractive({ useHandCursor: true });
    
            // Réattacher les événements à la zone interactive
            this.porteZone.on('pointerdown', () => {
                this.toggleDoor();
            });
        }
    }
        
    
}

class CarScene extends Phaser.Scene {
    constructor() {
        super('CarScene');
    }

    preload() {
        this.load.audio('carSound', 'assets/Car driving - Sound Effect（23）.mp3'); // Remplacez par le chemin correct
        this.load.image('voiture2', 'assets/voiture3.png'); // Assurez-vous de remplacer par le bon chemin
        this.load.audio('radio', 'assets/ElevenLabs_2024-11-18T21_37_22_Guillaume - Narration_pvc_s52_sb53_se13_b_m2_Voice Changer.mp3'); // Remplacez par le chemin correct
        this.load.image('house', 'assets/house5.png');

    }

    create() {

        // Charger l'inventaire actuel
        const currentInventory = this.registry.get('inventory') || [];
        
        // Ajouter directement la clé à l'inventaire si elle n'est pas déjà présente
        if (!currentInventory.includes('Clé')) {
            currentInventory.push('Clé');
            this.registry.set('inventory', currentInventory);
        }

        // Initialiser l'inventaire visuel
        this.inventory = new Inventory(this);
        this.inventory.updateInventory(currentInventory);

        // Assurez-vous que les slots et les objets sont bien visibles
        initializeInventory(this);

        this.inventory.slots.forEach(slot => {
            slot.setDepth(1000);
            if (slot.itemImage) {
                slot.itemImage.setDepth(1001);
            }
        });

        // Vérifier si la valeur de santé mentale existe dans le registre
    if (this.registry.get('mentalHealth') === undefined) {
        this.registry.set('mentalHealth', 100);
    }

    // Créer la barre de santé mentale
    const barWidth = 20;
    const barHeight = 200;
    const barX = this.cameras.main.width - barWidth - 20;
    const barY = 20;

    this.mentalHealthBar = new MentalHealthBar(this, barX, barY, barWidth, barHeight);

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Diminuer progressivement le son inheritanceSound
        const inheritanceSound = this.sound.get('inheritanceSound');
        if (inheritanceSound && inheritanceSound.isPlaying) {
            this.tweens.add({
                targets: inheritanceSound,
                volume: 0, // Volume final
                duration: 8000, // Durée de la diminution (2 secondes)
                ease: 'Linear',
                onComplete: () => {
                    inheritanceSound.stop(); // Stopper le son une fois le volume à 0

                    // Jouer le nouveau son "house"
                    const carSound = this.sound.add('carSound', { loop: true, volume: 0 });
                    carSound.play();
                    this.tweens.add({
                        targets: carSound,
                        volume: 1, // Augmenter le volume progressivement
                        duration: 5000, // Durée de l'augmentation (2 secondes)
                        ease: 'Linear'
                    });
                }
            });
        }
        

        // Créer un délai de 60 secondes avant de relancer la bande sonore
        this.time.delayedCall(60000, () => {
            carSound.play({ loop: true }); // Relancer le son en boucle après 60 secondes
            this.tweens.add({
                targets: carSound,
                volume: 1, // Assurez-vous que le volume est à 1 une fois la répétition lancée
                duration: 2000, // Durée de l'augmentation en ms
                ease: 'Power2'
            });
        });

        // Afficher l'image de la voiture
        const voitureImage = this.add.image(centerX, centerY, 'voiture2').setOrigin(0.5);

        this.cameras.main.fadeIn(1000, 0, 0, 0); // Durée de 1000 ms

        // Ajouter un effet de pulsation à l'image de la voiture
        this.tweens.add({
            targets: voitureImage,
            scale: { from: 1, to: 1.05 },
            duration: 10000,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: voitureImage,
            x: { from: centerX - 10, to: centerX + 10 },
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Appliquer l'effet VHS à la caméra
        this.cameras.main.setPostPipeline('VHS');
        
        // Ajout d'une zone interactive pour la radio
        const radioZoneWidth = 100; // Largeur de la zone de la radio
        const radioZoneHeight = 100; // Hauteur de la zone de la radio
        const radioZoneX = centerX + 150; // Position X de la zone
        const radioZoneY = centerY + 200; // Position Y de la zone

        const radioZone = this.add.zone(radioZoneX, radioZoneY, radioZoneWidth, radioZoneHeight);
        radioZone.setOrigin(0.5, 0.5);
        radioZone.setInteractive({ useHandCursor: true });

        // Ajouter un texte pour indiquer "RADIO"
        const radioText = this.add.text(radioZoneX, radioZoneY - 50, "RADIO", {
            font: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);


        // Ajouter un point brillant pour la zone
        const sparklingPoint = this.add.circle(radioZoneX, radioZoneY, 5, 0xffffff); // Un petit cercle blanc
        sparklingPoint.setAlpha(0.8); // Légère transparence

        // Animation scintillante pour le point
        this.tweens.add({
            targets: sparklingPoint,
            alpha: { from: 0.2, to: 0.8 }, // Variation de la transparence
            scale: { from: 0.8, to: 1.2 }, // Légère variation de taille
            duration: 800,
            yoyo: true,
            repeat: -1 // Répète indéfiniment
        });

        // Événements pour afficher/cacher le texte
        radioZone.on('pointerover', () => {
            radioText.setVisible(true);
        });

        radioZone.on('pointerout', () => {
            radioText.setVisible(false);
        });

        // Ajouter un événement de clic pour activer la bande-son
        radioZone.on('pointerdown', () => {
            const radioSound = this.sound.add('radio', { loop: false, volume: 1 });
            radioSound.play();

            // Afficher un message ou effectuer une action supplémentaire
            console.log("La radio est maintenant allumée.");
        });


        // Créer une boîte de dialogue
        this.dialogBox = this.add.rectangle(centerX, this.cameras.main.height - 100, 400, 100, 0x000000, 0.8);
        this.dialogBox.setOrigin(0.5);

        // Créer le texte de dialogue
        this.dialogText = this.add.text(centerX - 180, this.cameras.main.height - 120, "", {
            font: '16px Arial',
            fill: '#ffffff',
            wordWrap: { width: 360 }
        });

        // Créer un bouton "Next" avec un fond blanc et un texte noir
        this.nextButtonBackground = this.add.rectangle(centerX + 160, this.cameras.main.height - 70, 60, 30, 0xffffff);
        this.nextButtonText = this.add.text(centerX + 160, this.cameras.main.height - 70, "Next", {
            font: '16px Arial',
            fill: '#000000'
        }).setOrigin(0.5);

        // Rendre le bouton "Next" interactif
        this.nextButtonBackground.setInteractive({ useHandCursor: true });
        this.nextButtonBackground.on('pointerdown', () => this.showNextDialogue());

        // Regrouper le fond et le texte pour les rendre visibles ou invisibles ensemble
        this.nextButtonBackground.setVisible(false);
        this.nextButtonText.setVisible(false);

        // Afficher le premier dialogue
        this.currentDialogueIndex = 0;
        this.dialogues = [
            "*en route*",
            "Pourquoi est-ce que je me sens… aussi nerveux ? C’est juste une maison. Une maison que je ne connais même pas.",
            "Un héritage...Une maison avec un cousin que je ne connais même pas.",
            "On dirait un rêve.",
            "Et si j'allumé la radio pour mettre de la musique.",
            "Radio : ...et dans d’autres nouvelles, le corps d’un homme a été retrouvé près de la route 17. Les autorités suspectent..."
        ];
        this.showDialogue(this.dialogues[this.currentDialogueIndex]);
    }

    async loadInventory() {
        try {
            const response = await fetch('http://127.0.0.1:5000/carte_objets');
            const data = await response.json();
            this.inventory.updateInventory(data.objets);
    
            // Mettre à jour le registre global
            const updatedInventory = this.registry.get('inventory') || [];
            const newInventory = [...updatedInventory, ...data.objets];
            this.registry.set('inventory', newInventory);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'inventaire :', error);
        }
    }
    

    showDialogue(text) {
        this.dialogBox.setVisible(true);
        this.dialogText.setVisible(true);
        this.dialogText.setText(text);
        this.nextButtonBackground.setVisible(true); // Afficher le bouton "Next"
        this.nextButtonText.setVisible(true);
    }

    showNextDialogue() {
        this.currentDialogueIndex++;
        if (this.currentDialogueIndex < this.dialogues.length) {
            this.showDialogue(this.dialogues[this.currentDialogueIndex]);
        } else {
            // Masquer la boîte de dialogue et le bouton une fois que tous les dialogues ont été affichés
            this.dialogBox.setVisible(false);
            this.dialogText.setVisible(false);
            this.nextButtonBackground.setVisible(false);
            this.nextButtonText.setVisible(false);
    
            // Passer à la nouvelle scène
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('HouseScene'); // Transition vers la scène de la maison
            });
        }
    }
    
}

/*async function fetchDialogueWithLoading(prompt, dialogTextElement) {
    try {
        // Ajouter une animation de chargement
        const loadingText = "Génération en cours";
        dialogTextElement.setText(loadingText);
        dialogTextElement.setDepth(1003); // Assurez-vous qu'il est au-dessus des autres éléments

        let loading = true;
        const loadingAnimation = setInterval(() => {
            if (loading) {
                dialogTextElement.setText(dialogTextElement.text + ".");
                if (dialogTextElement.text.endsWith("...")) {
                    dialogTextElement.setText(loadingText); // Réinitialiser après 3 points
                }
            }
        }, 500); // Intervalle de 500 ms

        // Envoyer la requête à l'API
        const response = await fetch("http://127.0.0.1:5000/generate-dialogue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.text();
        loading = false; // Arrêter l'animation
        clearInterval(loadingAnimation); // Supprimer l'animation
        return data; // Retourne le texte généré
    } catch (error) {
        console.error("Erreur lors de l'appel à l'API :", error);
        return "Erreur : impossible de générer le texte.";
    }
}


/*
async function fetchDialogueWithProgress(prompt, dialogTextElement) {
    try {
        const response = await fetch("http://127.0.0.1:5000/generate-dialogue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let content = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            content += chunk;
            dialogTextElement.setText(content.trim()); // Mise à jour progressive
        }

        return content.trim();
    } catch (error) {
        console.error("Erreur lors de l'appel à l'API :", error);
        return "Erreur : impossible de générer le texte.";
    }
}
*/
/*
async function fetchGeneratedText(prompt) {
    try {
        const response = await fetch('http://127.0.0.1:5000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        return data.generated_text || "Erreur lors de la génération.";
    } catch (error) {
        console.error("Erreur lors de la récupération du texte :", error);
        return "Erreur : impossible de générer le texte.";
    }
}*/


class HouseScene extends Phaser.Scene {
    constructor() {
        super('HouseScene');
        this.isGeneratingText = false; // Indique si le texte est en cours de génération
        this.asciiBackground = null; // Référence à l'arrière-plan ASCII
        this.houseImage = null; // Référence à l'image de la maison

        // Propriétés pour le changement d'image
        this.backgroundImages = ['intérieur', 'chambre1', 'chambre2', 'couloir'];
        this.currentBackgroundIndex = 0;
        this.backgroundChangeEvent = null;
    }

    preload() {
        // --- Chargement des assets ---
        this.load.image('house', 'assets/house5.png'); 
        this.load.image('Houseportail', 'assets/house5portail.png');
        this.load.image('entrée', 'assets/entrée.png');
        this.load.image('intérieur', 'assets/intérieur.png');
        this.load.image('chambre1', 'assets/chambre1.png');
        this.load.image('chambre2', 'assets/chambre2.png');
        this.load.image('couloir', 'assets/couloir.png');
        
        this.load.image('Note', 'assets/letter-removebg.png');
        this.load.image('Pistolet', 'assets/pistolet.png');
        this.load.image('Clé', 'assets/key.png'); // si besoin de la clé

        // --- Chargement de l'audio si nécessaire ---
        this.load.audio('house', 'assets/Hollow Winter  Snow, Supernatural, Darkness  15 Minutes of Ambience.mp3');

        this.load.audio('scream', 'assets/scream.wav');
        this.load.audio('screaming', 'assets/screaming.wav');

    }

    changeBackgroundImage() {
        // Incrémenter l'index de l'image
        this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgroundImages.length;
        const nextImageKey = this.backgroundImages[this.currentBackgroundIndex];
    
        // Commencer le fondu noir
        this.cameras.main.fadeOut(1000, 0, 0, 0);
    
        // Après le fondu sortant
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Changer la texture de l'image de la maison
            this.houseImage.setTexture(nextImageKey);
    
            // Commencer le fondu entrant
            this.cameras.main.fadeIn(1000, 0, 0, 0);
        });
    }
    

    async fetchGeneratedText(prompt) {
        try {
            this.isGeneratingText = true; // Indique que la génération est en cours
            this.updateContinueButtonVisibility(); // Mettre à jour la visibilité du bouton
            this.nextButtonBackground.disableInteractive(); // Désactiver le bouton "Next"
            this.nextButtonText.setAlpha(0.5); // Rendre le bouton "Next" visuellement désactivé
    
            // Afficher le chargement
            this.showLoading();
    
            const response = await fetch('http://127.0.0.1:5000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur inconnue.");
            }
    
            const data = await response.json();
            const generatedText = data.generated_text || "Aucun texte généré.";
            const asciiImagePath = data.ascii_image_path || null;
    
            // Charger l'image ASCII si disponible
            if (asciiImagePath) {
                await this.loadAsciiBackground(asciiImagePath);
            }
    
            return generatedText;
        } catch (error) {
            console.error("Erreur lors de la récupération du texte :", error);
            return `Erreur : ${error.message}`;
        } finally {
            this.hideLoading(); // Masquer le chargement
            this.isGeneratingText = false; // Génération terminée
            this.updateContinueButtonVisibility(); // Mettre à jour la visibilité du bouton
            this.nextButtonBackground.setInteractive(); // Réactiver le bouton "Next"
            this.nextButtonText.setAlpha(1); // Rendre le bouton "Next" visuellement actif
        }
    }    

    
    async loadAsciiBackground(asciiImagePath) {
        return new Promise((resolve, reject) => {
            // Générer une clé unique pour éviter les conflits
            const key = `ascii_${Date.now()}`;

            // Charger l'image ASCII dynamiquement
            this.load.image(key, `http://127.0.0.1:5000${asciiImagePath}`);
            
            this.load.once('complete', () => {
                // Ajouter l'image en arrière-plan
                const centerX = this.cameras.main.width / 2;
                const centerY = this.cameras.main.height / 2;

                // Supprimer l'ancien arrière-plan s'il existe
                if (this.asciiBackground) {
                    this.asciiBackground.destroy();
                }

                this.asciiBackground = this.add.image(centerX, centerY, key).setOrigin(0.5).setDepth(-1); // Depth -1 pour être en arrière-plan
                resolve();
            });

            this.load.once('loaderror', (file) => {
                console.error(`Erreur de chargement de l'image ASCII : ${file.key}`);
                reject(new Error(`Erreur de chargement de l'image ASCII : ${file.key}`));
            });

            this.load.start();
        });
    }

    // Nouvelle méthode pour déclencher un événement aléatoire
    async triggerRandomEvent() {
        try {
            this.isGeneratingText = true; // Indique que la génération est en cours
            this.updateContinueButtonVisibility(); // Mettre à jour la visibilité du bouton
            this.nextButtonBackground.disableInteractive(); // Désactiver le bouton "Next"
            this.nextButtonText.setAlpha(0.5); // Rendre le bouton "Next" visuellement désactivé


            const response = await fetch('http://127.0.0.1:5000/evenement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}), // Pas de données nécessaires pour cet appel
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur inconnue.");
            }

            const data = await response.json();
            const generatedText = data.message || "Un événement s'est produit.";
            const evenementType = data.evenement_type || null;

            // Jouer le son approprié en fonction de l'événement
            if (evenementType) {
                this.playEventSound(evenementType);
            }

            // Sélectionner aléatoirement une nouvelle image de background
            const possibleBackgrounds = ['chambre1', 'chambre2', 'couloir'];
            const randomBackground = Phaser.Utils.Array.GetRandom(possibleBackgrounds);
            this.houseImage.setTexture(randomBackground);

            // Loguer le message de l'événement dans la console
            console.log(`Événement aléatoire de type "${evenementType}" : ${generatedText}`);
        } catch (error) {
            console.error("Erreur lors du déclenchement de l'événement :", error);
            // Optionnel : Vous pouvez toujours afficher une alerte ou un message spécifique si nécessaire
        } finally {
            this.isGeneratingText = false; // Génération terminée
            this.updateContinueButtonVisibility(); // Mettre à jour la visibilité du bouton
            this.nextButtonBackground.setInteractive(); // Réactiver le bouton "Next"
            this.nextButtonText.setAlpha(1); // Rendre le bouton "Next" visuellement actif
        }
    }



    // Méthode pour jouer le son en fonction du type d'événement avec volume réduit
    playEventSound(evenementType) {
        const volumeLevel = 0.1; // Réglez ce niveau selon vos préférences (0.0 à 1.0)
        switch (evenementType) {
            case 'monstre':
                this.sound.play('scream', { volume: volumeLevel }); // Volume réduit pour "monstre"
                break;
            case 'hallucination':
                this.sound.play('screaming', { volume: volumeLevel }); // Volume réduit pour "hallucination"
                break;
            case 'choc':
                this.sound.play('scream', { volume: volumeLevel }); // Volume réduit pour "choc"
                break;
            default:
                console.warn(`Aucun son défini pour l'événement type: ${evenementType}`);
        }
    }



    
    create() {

        // Diminuer progressivement le son carSound
       const carSound = this.sound.get('carSound');
       if (carSound && carSound.isPlaying) {
           this.tweens.add({
               targets: carSound,
               volume: 0, // Volume final
               duration: 8000, // Durée de la diminution (2 secondes)
               ease: 'Power2',
               onComplete: () => {
                   carSound.stop(); // Stopper le son une fois le volume à 0


                   // Jouer le nouveau son "house"
                   const houseSound = this.sound.add('house', { loop: true, volume: 0 });
                   houseSound.play();
                   this.tweens.add({
                       targets: houseSound,
                       volume: 1, // Augmenter le volume progressivement
                       duration: 3000, // Durée de l'augmentation (2 secondes)
                       ease: 'Power2'
                   });
               }
           });
       }

        /*this.input.keyboard.on('keydown-R', () => {
            // Appeler la route /evenement directement
            fetch('http://127.0.0.1:5000/evenement', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    console.log("Événement aléatoire déclenché :", data.message);
                    // Mettre à jour la barre
                    this.registry.set('mentalHealth', data.game_state.sante_mentale);
                    this.mentalHealthBar.setValue(data.game_state.sante_mentale);
                })
                .catch(err => console.error('Erreur lors du déclenchement d\'un événement aléatoire :', err));
        });*/
        
        this.sound.volume = 0.5;

        this.input.keyboard.on('keydown', async (event) => {
            if (!this.isGeneratingText && ['A', 'B', 'C'].includes(event.key.toUpperCase())) {
                const choix = event.key.toUpperCase(); // Récupère le choix
                console.log(`Choix sélectionné : ${choix}`);
        
                // Indiquer que la génération est en cours
                this.isGeneratingText = true;
                this.updateContinueButtonVisibility(); // Mettre à jour la visibilité du bouton
        
                // Envoyer le choix à l'API pour obtenir la suite
                const prompt = `Le joueur a choisi ${choix}. Quelle est la suite de l'histoire ?`;
                const texteGenere = await this.fetchGeneratedText(prompt);
        
                // Afficher le texte généré
                this.showDialogue(texteGenere);
        
                // La génération est terminée (déjà gérée dans fetchGeneratedText)
            } else if (this.isGeneratingText) {
                console.log("La génération est en cours, veuillez patienter...");
            }
        });        

        

        // Récupérer l'état de santé mentale via l'API
        fetch('http://127.0.0.1:5000/etat')
            .then(response => response.json())
            .then(data => {
                const mentalHealth = data.sante_mentale || 100; // Valeur par défaut

                // Créer la barre de santé mentale
                const barWidth = 20;
                const barHeight = 200;
                const barX = this.cameras.main.width - barWidth - 20;
                const barY = 20;

                this.mentalHealthBar = new MentalHealthBar(this, barX, barY, barWidth, barHeight);
                this.mentalHealthBar.setValue(mentalHealth);

                if (this.registry.get('mentalHealth') <= 35) {
                    if (this.cameras.main.postFX && !this.cameras.main.postFX.hasPostPipeline('RGBShift')) {
                        this.cameras.main.setPostPipeline('RGBShift');
                    }
                }                
            })
            .catch(err => console.error('Erreur lors de la récupération de la santé mentale :', err));

        // Exemple : diminuer la santé mentale et synchroniser avec le serveur
        this.input.keyboard.on('keydown-M', () => {
            const newValue = Math.max((this.mentalHealthBar.value || 100) - 10, 0);
            this.mentalHealthBar.setValue(newValue);

            // Mettre à jour la santé mentale côté serveur
            fetch('http://127.0.0.1:5000/update_mental_health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mental_health: newValue })
            })
                .then(response => response.json())
                .then(data => console.log('Santé mentale mise à jour :', data))
                .catch(err => console.error('Erreur lors de la mise à jour de la santé mentale :', err));
        });       

        // ------------------------ INVENTAIRE ------------------------
        // Récupère l’inventaire du registry ou un tableau vide
        const currentInventory = this.registry.get('inventory') || [];

        // Initialisation de l'inventaire graphique
        this.inventory = new Inventory(this);
        this.inventory.updateInventory(currentInventory);

        // Exemple d’appel à une API qui retourne la liste d’objets possédés
        this.loadInventory(); 
        initializeInventory(this); // Méthode ou fonction externe pour configurer l'UI d'inventaire

        // Ajuste la profondeur de l’inventaire (pour qu’il soit toujours visible)
        this.inventory.slots.forEach(slot => {
            slot.setDepth(1000);
            if (slot.itemImage) {
                slot.itemImage.setDepth(1001);
            }
        });

        // ----------------------- CAMÉRA / SCÈNE -----------------------
        // Effet de fade-in
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Coordonnées centrales
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Affiche l’image "house" au centre
        const houseImage = this.add.image(centerX, centerY, 'house').setOrigin(0.5);

        // --------------------- PORTAIL INTERACTIF ---------------------
        const portailZoneWidth = 200; 
        const portailZoneHeight = 300; 
        const portailZoneX = centerX;   
        const portailZoneY = centerY + 150;

        const portailZone = this.add.zone(portailZoneX, portailZoneY, portailZoneWidth, portailZoneHeight)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Texte « portail » (caché au départ)
        const portailText = this.add.text(portailZoneX, portailZoneY - 60, 'portail', {
            font: '20px',
            fill: '#ffffff',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setVisible(false);

        // Over/Out pour afficher/cacher le texte du portail
        portailZone.on('pointerover', () => portailText.setVisible(true));
        portailZone.on('pointerout', () => portailText.setVisible(false));

        // Clic sur le portail : on affiche l’image "Houseportail"
        portailZone.on('pointerdown', () => {
            houseImage.setTexture('Houseportail');
            portailZone.destroy();
            portailText.setVisible(false);

            // -------------------- TEXTE D'INSTRUCTION --------------------
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;

            const instructionText = this.add.text(centerX, centerY - 300, "Drag et drop la clé pour ouvrir la porte", {
                font: "17px Arial",
                fill: "#ffffff",
                stroke: "#000000", // Couleur de la bordure (noir)
                strokeThickness: 1, // Épaisseur de la bordure
                padding: { x: 10, y: 5 },
                align: "center"
            }).setOrigin(0.5);

            // Animation pour rendre le texte engageant
            this.tweens.add({
                targets: instructionText,
                alpha: { from: 2, to: 0.5 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });

            // Supprimer l'instruction après 10 secondes
            this.time.delayedCall(10000, () => {
                instructionText.destroy();
            });

            // -------------------- PORTE INTERACTIVE --------------------
            const porteZone = this.add.zone(centerX, centerY + 50, 150, 200)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            const porteText = this.add.text(centerX, centerY - 100, 'porte', {
                font: '20px',
                fill: '#ffffff',
                padding: { x: 10, y: 5 }
            })
            .setOrigin(0.5)
            .setVisible(false);

            porteZone.on('pointerover', () => porteText.setVisible(true));
            porteZone.on('pointerout', () => porteText.setVisible(false));

            // --- Vérifier si la clé est dans l’inventaire ---
            const keySlot = this.inventory.slots.find(
                (slot) => slot.itemImage && slot.itemImage.texture.key === 'Clé'
            );

            if (keySlot) {
                // Rendre l'icône de la clé draggable
                const keyImage = keySlot.itemImage;
                keyImage.setInteractive({ draggable: true });
                this.input.setDraggable(keyImage);

                // Déplacement visuel de la clé pendant le drag
                keyImage.on('drag', (pointer, dragX, dragY) => {
                    keyImage.x = dragX;
                    keyImage.y = dragY;
                });

                // À la fin du drag, on vérifie si la clé est déposée sur la porte
                keyImage.on('dragend', (pointer) => {
                    const porteBounds = porteZone.getBounds();
                    const isDroppedOnDoor = Phaser.Geom.Rectangle.ContainsPoint(porteBounds, pointer);

                    if (isDroppedOnDoor) {
                        console.log("La clé a été utilisée pour ouvrir la porte !");

                        // 1) Changer l'image en "entrée"
                        houseImage.setTexture('entrée');

                        // 2) Retirer la clé de l'inventaire (logique)
                        const updatedInventory = currentInventory.filter(item => item !== 'Clé');
                        this.registry.set('inventory', updatedInventory);
                        this.inventory.updateInventory(updatedInventory);

                        // 3) Détruire l’icône de la clé
                        keyImage.destroy();

                        // 4) Nettoyer la porte
                        porteZone.destroy();
                        porteText.destroy();

                        // 5) Effet de fondu avant d’afficher l'image "entrée"
                        this.cameras.main.fadeOut(500, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.cameras.main.fadeIn(500, 0, 0, 0);
                            this.showDialogue("Bienvenue dans l'entrée de la maison.");

                            // On peut désormais créer une zone "salon" ou autre logique
                            this.creerZoneSalon(houseImage);
                        });
                    } else {
                        // Si pas déposé sur la porte, on replace la clé dans l'inventaire
                        keyImage.setPosition(
                            keySlot.x + this.inventory.slotSize / 2,
                            keySlot.y + this.inventory.slotSize / 2
                        );
                    }
                });
            }

            // Clic direct sur la porte (sans drag & drop)
            porteZone.on('pointerdown', () => {
                console.log("Porte cliquée : la porte est fermée à clé.");
                this.showDialogue("La porte est fermée... J'ai besoin d'une clé.");
            });
        });

        // ---------------- ANIMATIONS / DIALOGUES INITIAUX --------------
        this.initDialoguesEtUI(houseImage);

        // Vérifiez la santé mentale et appliquez l'effet RGBShift
        const mentalHealth = this.registry.get('mentalHealth') || 100;
        if (mentalHealth <= 35) {
            console.log("Effet RGB activé (santé mentale <= 35)");
            this.applyRGBShift();
        }

        // Récupérer les événements de mise à jour de la santé mentale
        this.events.on('updateMentalHealth', (newValue) => {
            if (newValue <= 35) {
                this.applyRGBShift();
            } else {
                this.removeRGBShift();
            }
        });

        // Création du bouton "Continuer l'histoire" en bas à gauche de l'image "intérieur"
        // Création du bouton "Continuer l'histoire" en bas à gauche de l'image "intérieur"
        this.continueStoryButton = this.add.text(50, this.cameras.main.height - 50, "Continuer l'histoire", {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#0000ff',
            padding: { x: 10, y: 5 },
            borderRadius: 5
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .setVisible(false) // Initialement invisible
        .setDepth(2000); // Augmenter la profondeur pour être au-dessus des autres éléments


        // Ajouter l'événement de clic sur le bouton
        this.continueStoryButton.on('pointerdown', () => {
            this.continueStory();
        });

        // Ajouter un écouteur pour mettre à jour la visibilité du bouton en fonction des états
        this.events.on('dialogOpened', () => {
            this.isDialogueOpen = true;
            this.updateContinueButtonVisibility();
        });

        this.events.on('dialogClosed', () => {
            this.isDialogueOpen = false;
            this.updateContinueButtonVisibility();
        });

        this.events.on('generationStarted', () => {
            this.isGeneratingText = true;
            this.updateContinueButtonVisibility();
        });

        this.events.on('generationEnded', () => {
            this.isGeneratingText = false;
            this.updateContinueButtonVisibility();
        });

        this.events.on('scenarioInterrupted', () => {
            this.isScenarioInterrupted = true;
            this.updateContinueButtonVisibility();
        });

        this.events.on('scenarioResumed', () => {
            this.isScenarioInterrupted = false;
            this.updateContinueButtonVisibility();
        });

        // Positionnement du bouton en bas à gauche (ajustez selon vos besoins)
        this.continueStoryButton.setPosition(50, this.cameras.main.height - 50);
    }

    updateContinueButtonVisibility() {
        console.log(`Dialogue ouvert: ${this.isDialogueOpen}, Génération en cours: ${this.isGeneratingText}, Scénario interrompu: ${this.isScenarioInterrupted}`);
        if (!this.isDialogueOpen && !this.isGeneratingText && this.isScenarioInterrupted) {
            this.continueStoryButton.setVisible(true);
            console.log("Bouton 'Continuer l'histoire' rendu visible.");
        } else {
            this.continueStoryButton.setVisible(false);
            console.log("Bouton 'Continuer l'histoire' caché.");
        }
    }
    
    
    continueStory() {
        console.log("Le joueur a cliqué sur 'Continuer l'histoire'.");
        if (this.isScenarioInterrupted) {
            const prompt = "Continuer le scénario";
            this.fetchGeneratedText(prompt)
                .then((texteGenere) => {
                    this.showDialogue(texteGenere);
                    this.isScenarioInterrupted = false;
                    this.events.emit('scenarioResumed');
                    console.log("Événement 'scenarioResumed' émis.");
                })
                .catch((error) => {
                    console.error("Erreur lors de la continuation du scénario :", error);
                });
        }
    }
    

    // -- ANIMATION LOOP LOADING PENDANT QUE OLLAMA GÉNÉRÉ LE TEXTE --

    showLoading() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
    
        // Ajoutez un fond semi-transparent
        this.loadingBackground = this.add.rectangle(
            centerX, centerY, 
            this.cameras.main.width, this.cameras.main.height, 
            0x000000, 0.7
        ).setOrigin(0.5);
    
        // Ajoutez un texte "Chargement..." clignotant
        this.loadingText = this.add.text(
            centerX, centerY, 
            "Chargement...", 
            { font: "20px Arial", fill: "#ffffff" }
        ).setOrigin(0.5).setDepth(1000); // Profondeur élevée pour être au premier plan

        // Animation clignotante
        this.tweens.add({
            targets: this.loadingText,
            alpha: { from: 1, to: 0 },
            duration: 500,
            yoyo: true,
            repeat: -1 // Infini
        });
    }
    
    hideLoading() {
        // Supprimer le fond et le texte
        if (this.loadingBackground) this.loadingBackground.destroy();
        if (this.loadingText) this.loadingText.destroy();
    }
    

    // -------------------------------------------------------------------------
    //   MÉTHODES POUR L'INVENTAIRE, RAMASSAGE D'OBJET, DIALOGUES, ETC.
    // -------------------------------------------------------------------------
    async loadInventory() {
        try {
            const response = await fetch('http://127.0.0.1:5000/carte_objets');
            const data = await response.json();
            this.inventory.updateInventory(data.objets);
            this.registry.set('inventory', data.objets);
        } catch (error) {
            console.error("Erreur lors du chargement de l'inventaire :", error);
        }
    }

    // Ramassage d’un objet via clic
    async ramasserObjet(nomObjet, objetImage) {
        try {
            const response = await fetch('http://127.0.0.1:5000/ramasser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    x: objetImage.x, 
                    y: objetImage.y, 
                    tolerance: 20 
                })
            });

            const data = await response.json();

            if (response.ok && data.message.includes('ramassé')) {
                console.log(`${nomObjet} ramassé !`);
                objetImage.destroy(); 
                this.inventory.updateInventory(data.game_state.inventaire);
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Erreur lors du ramassage :', error);
        }
    }

    showNote() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
    
        // Créer un fond noir semi-transparent
        const background = this.add.rectangle(
            centerX, centerY,
            this.cameras.main.width, this.cameras.main.height,
            0x000000, 0.8
        ).setOrigin(0.5);
    
        // Ajouter l'image de la note au centre
        const noteImage = this.add.image(centerX - 150, centerY, 'Note');
        noteImage.setScale(0.5); // Ajuster la taille de l'image
        noteImage.setOrigin(0.5); // Centrer l'image
    
        // Ajouter le texte à côté de l'image
        const noteText = this.add.text(
            centerX + 200, centerY - 300, // Position ajustée pour correspondre à l'image
            "À toi qui lis ces mots,\n\n" +
            "Tu es ici parce qu’il en a été décidé ainsi. Cette maison... ce n’est pas un simple héritage.\n\n" +
            "Elle respire, elle écoute, et elle observe. Ce qui s’y trouve ne peut être expliqué, mais peut-être, avec le temps, tu comprendras.\n\n" +
            "Les murs portent des souvenirs qui ne sont pas les tiens, mais ils te réclament. Il y a des choses que même le temps ne peut effacer.\n\n" +
            "Ne pose pas les mauvaises questions.\n\n" +
            "Une pièce est cachée. Tu n’es pas prêt. Mais lorsqu’elle t’appellera, tu sauras où aller.\n\n" +
            "Rappelle-toi : \"Ce qui est perdu n’est jamais oublié. Ce qui est trouvé pourrait te perdre.\"\n\n" +
            "Reviens au point de départ si les réponses te fuient. Et si la maison commence à murmurer… écoute, mais ne réponds pas.\n\n" +
            "Nous sommes toujours là. Toujours.\n\n" +
            "— T.",
            {
                font: '16px Arial', // Taille de police augmentée pour correspondre à la taille de l'image
                fill: '#ffffff',
                wordWrap: { width: 400 } // Ajuster la largeur du texte
            }
        );
    
        // Ajouter un bouton pour fermer la vue
        const closeButton = this.add.text(
            centerX, centerY - 300, // Position ajustée pour rester visible sous l'image
            "Fermer",
            {
                font: '22px Arial', // Police légèrement plus grande
                fill: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 15, y: 10 }
            }
        ).setOrigin(0.5).setInteractive();
    
        closeButton.on('pointerdown', () => {
            background.destroy();
            noteImage.destroy();
            noteText.destroy();
            closeButton.destroy();
        });
    }        
    
    // Création d’une zone "salon" après l’entrée
    creerZoneSalon(houseImage) {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
    
        const salonZone = this.add.zone(centerX + 150, centerY + 100, 150, 100)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
    
        const salonText = this.add.text(centerX + 150, centerY + 40, 'salon', {
            font: '20px',
            fill: '#ffffff',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setVisible(false);

        // Ajouter un point brillant pour la zone
        const sparklingPoint = this.add.circle(centerX + 150, centerY + 40, 5, 0xffffff); // Un petit cercle blanc
        sparklingPoint.setAlpha(0.8); // Légère transparence

        // Animation scintillante pour le point
        this.tweens.add({
            targets: sparklingPoint,
            alpha: { from: 0.2, to: 0.8 }, // Variation de la transparence
            scale: { from: 0.8, to: 1.2 }, // Légère variation de taille
            duration: 800,
            yoyo: true,
            repeat: -1 // Répète indéfiniment
        });

        // Vérifier si la clé est visible dans la scène
        const key = this.children.list.find(child => child.texture && child.texture.key === 'Clé');
        if (key) {
            key.setVisible(false); // Rendre la clé invisible
            console.log("La clé est maintenant invisible.");
        } else {
            console.log("Aucune clé visible à cacher.");
        }
    
        salonZone.on('pointerover', () => salonText.setVisible(true));
        salonZone.on('pointerout', () => salonText.setVisible(false));
    
        salonZone.on('pointerdown', () => {
            console.log("Salon cliqué !");
            this.cameras.main.fadeOut(500, 0, 0, 0);
    
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // 1) On change l'image principale en "intérieur"
                houseImage.setTexture('intérieur');
                salonZone.destroy();
                salonText.destroy();
                this.cameras.main.fadeIn(500, 0, 0, 0);
    
                // 2) Dialogue
                this.showDialogue("Vous êtes maintenant dans le salon...");
                // Affichage d'instructions après génération de texte par Ollama

                // Indiquer que le scénario est en cours et non interrompu
                this.isScenarioInterrupted = false;
                this.events.emit('scenarioResumed');

                // Déclencher l'événement aléatoire ici
                this.triggerRandomEvent();

                this.fetchGeneratedText("recommence la partie")
                    .then((texteGenere) => {
                        // Afficher le texte généré dans le panneau de dialogue
                        this.showDialogue(texteGenere);

                        // Remet l'indicateur à false après la génération
                        this.isGeneratingText = false;

                        // Ajouter un texte d'instruction uniquement si la génération est terminée
                        if (!this.isGeneratingText) {
                            const centerX = this.cameras.main.width / 2;
                            const centerY = this.cameras.main.height / 2;

                            const instructionText = this.add.text(centerX, centerY - 350, "Appuyer sur A, B ou C pour faire votre choix", {
                                font: "17px Arial",
                                fill: "#ffffff",
                                padding: { x: 10, y: 5 },
                                align: "center"
                            }).setOrigin(0.5);

                            // Animation pour rendre le texte plus engageant
                            const instructionTween = this.tweens.add({
                                targets: instructionText,
                                alpha: { from: 1, to: 0 },
                                duration: 1000,
                                yoyo: true,
                                repeat: -1
                            });

                            // Stocker une référence pour supprimer le texte si nécessaire
                            this.instructionText = instructionText;
                            this.instructionTween = instructionTween;
                        }
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la génération du texte :", error);
                    });

                // Avant d'appeler la génération de texte, assurez-vous de cacher l'instruction si elle existe
                if (this.instructionText) {
                    this.instructionText.destroy(); // Supprimer le texte existant
                    if (this.instructionTween) this.instructionTween.stop(); // Stopper l'animation
                }

                // Indiquer que la génération est en cours
                this.isGeneratingText = true;

                        
    
                // 3) FAIRE APPARAÎTRE NOTE ET PISTOLET en plus petit
                const note = this.add.image(1200, 600, 'Note').setInteractive();
                // Option A : via setScale
                note.setScale(0.1);
    
                // Option B : via setDisplaySize
                // note.setDisplaySize(50, 50);
    
                note.setDepth(1);
                note.on('pointerdown', () => {
                    this.ramasserObjet('Note', note);
                });
    
                const pistolet = this.add.image(400, 600, 'Pistolet').setInteractive();
                // Même chose : on le réduit, par exemple par scale 0.7
                pistolet.setScale(0.2);
    
                // Ou en pixels fixes
                // pistolet.setDisplaySize(64, 64);
    
                pistolet.setDepth(1);
                pistolet.on('pointerdown', () => {
                    this.ramasserObjet('Pistolet', pistolet);
                });

                // Initialiser le cycle de changement d'image
                this.startBackgroundCycle(houseImage);
            });
        });
    }

    // Démarrer le cycle de changement d'image
    startBackgroundCycle(houseImage) {
        // Stocker la référence de houseImage si nécessaire
        this.houseImage = houseImage;

        // Initialiser l'index de l'image courante
        this.currentBackgroundIndex = this.backgroundImages.indexOf(houseImage.texture.key);
        if (this.currentBackgroundIndex === -1) {
            this.currentBackgroundIndex = 0;
            this.houseImage.setTexture(this.backgroundImages[this.currentBackgroundIndex]);
        }

        // Créer un événement temporel qui se répète toutes les 2 minutes (120000 ms)
        this.backgroundChangeEvent = this.time.addEvent({
            delay: 120000, // 2 minutes en millisecondes
            callback: this.changeBackgroundImage,
            callbackScope: this,
            loop: true
        });
    }

    // Arrêter le cycle de changement d'image (si nécessaire)
    stopBackgroundCycle() {
        if (this.backgroundChangeEvent) {
            this.backgroundChangeEvent.remove(false);
            this.backgroundChangeEvent = null;
        }
    }

    shutdown() {
        this.stopBackgroundCycle();
        // Autres nettoyages si nécessaire
    }
    
    initDialoguesEtUI() {
        this.dialoguesHouse = [
            "C'est ici... la maison que j'ai héritée.",
            "Elle semble renfermer de nombreux mystères.",
            "(Un frisson me parcourt alors que je fixe le portail...)"
        ];
        this.currentDialogueIndexHouse = 0;
    
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
    
        // Boîte de dialogue
        const dialogBoxWidth = 800;
        const dialogBoxHeight = 500;
        this.dialogBox = this.add.rectangle(centerX, centerY, dialogBoxWidth, dialogBoxHeight, 0x000000, 0.8);
    
        // Zone de masque pour le texte
        const maskShape = this.make.graphics().fillRect(
            centerX - dialogBoxWidth / 2 + 20,
            centerY - dialogBoxHeight / 2 + 20,
            dialogBoxWidth - 40,
            dialogBoxHeight - 80
        );
        const textMask = maskShape.createGeometryMask();
    
        // Texte de dialogue avec masque
        this.dialogText = this.add.text(centerX - dialogBoxWidth / 2 + 30, centerY - dialogBoxHeight / 2 + 30, "", {
            font: '16px Arial',
            fill: '#ffffff',
            wordWrap: { width: dialogBoxWidth - 60, useAdvancedWrap: true }
        }).setOrigin(0).setMask(textMask);
    
        // Barre de défilement
        const scrollBarHeight = dialogBoxHeight - 80;
        const scrollBarX = centerX + dialogBoxWidth / 2 - 30;
        const scrollBarY = centerY - dialogBoxHeight / 2 + 40;
    
        this.scrollBar = this.add.rectangle(scrollBarX, scrollBarY, 10, scrollBarHeight, 0xaaaaaa).setOrigin(0.5, 0);
        this.scrollThumb = this.add.rectangle(scrollBarX, scrollBarY, 10, 50, 0xffffff).setOrigin(0.5, 0).setInteractive();
    
        // Variables pour le défilement
        this.textScrollOffset = 0;
        this.maxScrollOffset = Math.max(0, this.dialogText.height - (dialogBoxHeight - 80));
    
        // Dragging pour la barre de défilement
        this.input.setDraggable(this.scrollThumb);
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.scrollThumb) {
                const clampedY = Phaser.Math.Clamp(dragY, scrollBarY, scrollBarY + scrollBarHeight - 50);
                this.scrollThumb.y = clampedY;
    
                // Calculer l'offset du texte en fonction de la position de la barre
                const scrollRatio = (clampedY - scrollBarY) / (scrollBarHeight - 50);
                this.textScrollOffset = scrollRatio * this.maxScrollOffset;
                this.dialogText.y = centerY - dialogBoxHeight / 2 + 30 - this.textScrollOffset;
            }
        });
    
        // Écouter les événements de molette pour le défilement
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const scrollStep = 20;
            this.textScrollOffset = Phaser.Math.Clamp(this.textScrollOffset + deltaY * scrollStep, 0, this.maxScrollOffset);
    
            this.dialogText.y = centerY - dialogBoxHeight / 2 + 30 - this.textScrollOffset;
    
            const scrollRatio = this.textScrollOffset / this.maxScrollOffset;
            this.scrollThumb.y = scrollBarY + scrollRatio * (scrollBarHeight - this.scrollThumb.height);
        });
    
        // Bouton "Next"
        this.nextButtonBackground = this.add.rectangle(centerX + dialogBoxWidth / 2 - 80, centerY + dialogBoxHeight / 2 - 40, 100, 40, 0xffffff);
        this.nextButtonText = this.add.text(centerX + dialogBoxWidth / 2 - 80, centerY + dialogBoxHeight / 2 - 40, "Next", {
            font: '16px Arial',
            fill: '#000000',
        }).setOrigin(0.5);
    
        this.dialogBox.setDepth(1000);
        this.dialogText.setDepth(1001);
        this.scrollBar.setDepth(1002);
        this.scrollThumb.setDepth(1003);
        this.nextButtonBackground.setDepth(1004);
        this.nextButtonText.setDepth(1005);
    
        this.showDialogue(this.dialoguesHouse[this.currentDialogueIndexHouse]);
    
        this.nextButtonBackground.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.currentDialogueIndexHouse++;
            if (this.currentDialogueIndexHouse < this.dialoguesHouse.length) {
                this.showDialogue(this.dialoguesHouse[this.currentDialogueIndexHouse]);
            } else {
                this.dialogBox.setVisible(false);
                this.dialogText.setVisible(false);
                this.scrollBar.setVisible(false);
                this.scrollThumb.setVisible(false);
                this.nextButtonBackground.setVisible(false);
                this.nextButtonText.setVisible(false);
                this.hideDialogue();
            }
        });
    }    

    showDialogue(text) {
        this.dialogBox.setVisible(true);
        this.dialogText.setVisible(true);
        this.nextButtonBackground.setVisible(true);
        this.nextButtonText.setVisible(true);
        this.scrollBar.setVisible(true);
        this.scrollThumb.setVisible(true);
    
        // Définir le texte dans la boîte de dialogue
        this.dialogText.setText(text);
    
        // Réinitialiser le défilement
        this.textScrollOffset = 0;
        this.dialogText.y = this.dialogBox.y - this.dialogBox.height / 2 + 30;
    
        // Calculer le décalage maximal possible pour le texte
        this.maxScrollOffset = Math.max(0, this.dialogText.height - (this.dialogBox.height - 80));
    
        // Réinitialiser la position du pouce de la barre de défilement
        this.scrollThumb.y = this.scrollBar.y;
    
        // Marquer que la boîte de dialogue est ouverte
        this.isDialogueOpen = true;
        this.events.emit('dialogOpened');
        console.log("Événement 'dialogOpened' émis.");
    }
    
    hideDialogue() {
        this.dialogBox.setVisible(false);
        this.dialogText.setVisible(false);
        this.nextButtonBackground.setVisible(false);
        this.nextButtonText.setVisible(false);
        this.scrollBar.setVisible(false);
        this.scrollThumb.setVisible(false);
    
        // Marquer que la boîte de dialogue est fermée
        this.isDialogueOpen = false;
        this.events.emit('dialogClosed');
        console.log("Événement 'dialogClosed' émis.");

        if (this.currentDialogueIndexHouse >= this.dialoguesHouse.length) {
            this.isScenarioInterrupted = true;
            this.events.emit('scenarioInterrupted');
            console.log("Événement 'scenarioInterrupted' émis.");
        }
    }
       
}


// Configuration du jeu
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [MainMenu, IntroScene, HospitalScene, CarScene, HouseScene, GameScene],
    pipeline: { 'VHS': VHSPipeline, 'RGBShift': RGBShiftPipeline},
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// Créer une instance du jeu
const game = new Phaser.Game(config);
 
 
// Ajuster la taille du jeu à la fenêtre du navigateur
window.addEventListener('resize', resizeGame);
 
 
function resizeGame() {
    game.scale.resize(window.innerWidth, window.innerHeight);
}

// 5. Ajouter un Écouteur d'Événement pour l'Icône Persistante Après l'Initialisation de `game`
const homeIcon = document.getElementById('homeIcon');
if (homeIcon) {
    homeIcon.addEventListener('click', () => {
        // Démarrer la scène MainMenu, quelle que soit la scène actuelle
        game.scene.start('MainMenu');
    });
} else {
    console.error('Élément #homeIcon non trouvé dans le DOM.');
}