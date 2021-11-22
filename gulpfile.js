var gulp = require('gulp'),
    sass = require('gulp-sass'),
    browserSync = require('browser-sync').create(),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    cleanCSS = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    nano = require('gulp-cssnano'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    glob = require('glob'),
    path = require('path'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

gulp.task('img', async function () {
    return gulp.src('src/images/**/*')
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/images/'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('fonts', function () {
    return gulp.src(['src/fonts/**/*'])
        .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('cache', function () {
    return cache.clearAll();
});

gulp.task('styles', async function () {
    gulp.src('src/styles/*.sass')
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(cleanCSS())
        .pipe(nano())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/styles/'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('browser-sync', async function () {
    browserSync.init({
        server: {baseDir: 'dist'},
        notify: false,
    });
});

gulp.task('styles-vendor', async function () {
    return gulp.src('src/styles/vendor/**/*')
        .pipe(concat('vendor.min.css'))
        .pipe(cleanCSS())
        .pipe(nano())
        .pipe(gulp.dest('dist/styles/'))
});

gulp.task('scripts', async function () {
    var files = glob.sync('src/scripts/*.js');
    files.map(function (file) {
        return browserify(file, {debug: true})
            .transform(babelify.configure({presets: ['@babel/preset-env']}))
            .bundle()
            .pipe(source(path.basename(file, '.js') + '.js'))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(gulp.dest('dist/scripts'));
    });
});


gulp.task('scripts-vendor', async function () {
    return gulp.src('src/scripts/vendor/*.js')
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('html', async function () {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.reload({ stream: true }))
});

gulp.task('watch', async function () {
    gulp.watch('src/**/*.sass', gulp.parallel('styles'));
    gulp.watch('src/*.html', gulp.parallel('html'));
    gulp.watch('src/**/*.js', gulp.parallel('scripts'));
    gulp.watch('src/images/**/*', gulp.parallel('img'));
});

gulp.task('build', gulp.parallel('img', 'fonts', 'styles', 'styles-vendor', 'scripts', 'scripts-vendor', 'html'));

gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));
