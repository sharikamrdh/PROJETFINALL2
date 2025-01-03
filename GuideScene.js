// GuideScene.js
class GuideScene extends Phaser.Scene {
    constructor() {
        super('GuideScene');
    }

    preload() {
        // Charger une image de fond pour le guide si nécessaire
        this.load.image('guideBackground', 'assets/guideBackground.png'); // Assurez-vous d'avoir cette image
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Ajouter un fond semi-transparent
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8).setOrigin(0);

        // Ajouter une image de fond pour le guide (optionnel)
        this.add.image(centerX, centerY, 'guideBackground').setScale(0.8).setDepth(1);

        // Ajouter le contenu du guide en tant qu'élément DOM
        const guideContent = `
            <div id="guide">
                <h1>Guide du Jeu</h1>
                <p>Bienvenue dans <strong>The Hollow Reflection</strong> ! Voici comment jouer :</p>
                <ul>
                    <li><strong>Contrôles :</strong> Utilisez les touches fléchées pour vous déplacer.</li>
                    <li><strong>Inventaire :</strong> Appuyez sur 'I' pour ouvrir votre inventaire.</li>
                    <li><strong>Interactions :</strong> Cliquez sur les objets interactifs pour les examiner.</li>
                    <li><strong>Objectif :</strong> Explorez l'hôpital abandonné et découvrez les secrets cachés.</li>
                </ul>
                <button id="closeGuide" class="close-button">Fermer</button>
            </div>
        `;

        // Créer un élément DOM pour le guide
        this.add.dom(centerX, centerY).createFromHTML(guideContent).setDepth(2);

        // Ajouter un écouteur d'événement pour le bouton de fermeture
        const closeButton = document.getElementById('closeGuide');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.scene.stop('GuideScene');
                this.scene.resume('MainMenu'); // Reprendre le menu principal
            });
        }

        // Mettre en pause le menu principal
        this.scene.pause('MainMenu');
    }
}
