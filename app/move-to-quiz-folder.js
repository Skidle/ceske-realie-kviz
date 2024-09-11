const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const buildDir = path.join(__dirname, 'build');
const quizDir = path.join(buildDir, 'quiz');

if (fs.existsSync(quizDir)) {
    fse.removeSync(quizDir);
}

fs.mkdirSync(quizDir);

fse.moveSync(path.join(buildDir, 'static'), path.join(quizDir, 'static'));
fse.moveSync(path.join(buildDir, 'index.html'), path.join(quizDir, 'index.html'));

// fs.writeFileSync(path.join(buildDir, 'index.html'), '<meta http-equiv="refresh" content="0; url=/quiz" />');
