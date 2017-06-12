const gulp = require('gulp')
const ts = require('gulp-typescript')
const tsProject = ts.createProject('tsconfig.json')

gulp.task('build', function () {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('./dist/'))
})

gulp.task('watch', ['build'], function () {
  gulp.watch('./src/**/*.ts', ['build'])
})

gulp.task('default', ['build'])