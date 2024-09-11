const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const buildDir = path.join(__dirname, 'build');
const quizDir = path.join(buildDir, 'kviz');

const publicDir = path.join(__dirname, 'public');
const mainPageDir = path.join(publicDir, 'main');

if (fs.existsSync(quizDir)) {
    fse.removeSync(quizDir);
}

fs.mkdirSync(quizDir);

fse.removeSync(path.join(buildDir, 'main'));
fse.removeSync(path.join(buildDir, 'sssz-formular.pdf'));

fs.readdirSync(buildDir).forEach(file => {
    const srcPath = path.join(buildDir, file);
    const destPath = path.join(quizDir, file);

    if (file !== 'kviz') {
        fse.moveSync(srcPath, destPath);
    }
});

fse.copySync(mainPageDir, buildDir);
fs.copyFileSync(path.join(publicDir, 'sssz-formular.pdf'), path.join(buildDir, 'sssz-formular.pdf'));

console.log('All files moved to "build/kviz" successfully.');
