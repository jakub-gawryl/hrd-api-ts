const {src, dest, series} = require('gulp')
const ts = require('gulp-typescript')
const del = require('del')

const targetDir = './build'
const project = ts.createProject('tsconfig.json')

const clean = () => del([targetDir])

const parseTS = () => {
  const tsResult = src("src/**/*.ts").pipe(project())
  return tsResult.js.pipe(dest(targetDir))
}

const copyFiles = () => src("src/**/*.*", {ignore: "src/**/*.ts"}).pipe(dest(targetDir));

exports.build = series(clean, parseTS, copyFiles)