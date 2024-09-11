const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const buildDir = path.join(__dirname, 'build');
const quizDir = path.join(buildDir, 'kviz');
const mainPageDir = path.join(__dirname, 'public', 'main');

if (fs.existsSync(quizDir)) {
    fse.removeSync(quizDir);
}

fs.mkdirSync(quizDir);

fse.removeSync(path.join(buildDir, 'main'));

fs.readdirSync(buildDir).forEach(file => {
    const srcPath = path.join(buildDir, file);
    const destPath = path.join(quizDir, file);

    if (file !== 'kviz') {
        fse.moveSync(srcPath, destPath);
    }
});

fse.copySync(mainPageDir, buildDir);

console.log('All files moved to "build/kviz" successfully.');
