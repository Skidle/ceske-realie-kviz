const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const buildDir = path.join(__dirname, 'build');
const quizDir = path.join(buildDir, 'kviz');

if (fs.existsSync(quizDir)) {
    fse.removeSync(quizDir);
}

fs.mkdirSync(quizDir);

fs.readdirSync(buildDir).forEach(file => {
    const srcPath = path.join(buildDir, file);
    const destPath = path.join(quizDir, file);

    if (file !== 'kviz') {
        fse.moveSync(srcPath, destPath);
    }
});

console.log('All files moved to "build/kviz" successfully.');
