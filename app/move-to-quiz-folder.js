const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const buildDir = path.join(__dirname, 'build');
const quizDir = path.join(buildDir, 'kviz');

const publicDir = path.join(__dirname, 'public');
const mainPageDir = path.join(publicDir, 'main');
const ssszDir = path.join(publicDir, 'sssz');

if (fs.existsSync(quizDir)) {
    fse.removeSync(quizDir);
}

fs.mkdirSync(quizDir);

fse.removeSync(path.join(buildDir, 'main'));
fse.removeSync(path.join(buildDir, 'sssz'));

fs.readdirSync(buildDir).forEach(file => {
    const srcPath = path.join(buildDir, file);
    const destPath = path.join(quizDir, file);

    if (file !== 'kviz') {
        fse.moveSync(srcPath, destPath);
    }
});

fse.copySync(mainPageDir, buildDir);
fse.copySync(ssszDir, 'build/sssz');

console.log('All files moved to "build/kviz" successfully.');
