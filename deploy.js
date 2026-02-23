import 'dotenv/config';
import FtpDeploy from 'ftp-deploy';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs'; // Beolvasáshoz kell

const ftpDeploy = new FtpDeploy();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Beolvassuk a privát kulcsot
const privateKey = fs.readFileSync(process.env.SSH_KEY_PATH, 'utf8');

const config = {
    user: process.env.DEPLOY_USER,
    host: process.env.HOST,
    port: 22,
    localRoot: __dirname + "/dist",
    remoteRoot: "/var/www/leining-app/",
    include: ["*", "**/*"],
    exclude: ["dist/**/*.map", "node_modules/**", ".git/**", ".env"],
    sftp: true,
	sftpOptions: {
        // NEM kell privateKey és NEM kell passphrase
        agent: process.env.SSH_AUTH_SOCK 
    }
};

console.log("🚀 Deployment indítása...");

ftpDeploy
    .deploy(config)
    .then((res) => console.log("\n✅ Sikeres feltöltés az összes fájlra!"))
    .catch((err) => {
        console.error("\n❌ Hiba történt a feltöltés során:");
        console.error(err);
    });

// Haladás jelzése
ftpDeploy.on("uploading", function (data) {
    process.stdout.write(`\rFeltöltés: ${data.transferredFileCount} / ${data.totalFilesCount} (${data.filename})`);
});
