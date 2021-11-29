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
    buffer = require('vinyl-buffer'),
    sourcemaps = require('gulp-sourcemaps'),
    tsify = require('tsify');

//optimize images
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

//move fonts
gulp.task('fonts', function () {
    return gulp.src(['src/fonts/**/*'])
        .pipe(gulp.dest('dist/fonts/'));
});

//clear img task cache
gulp.task('cache', function () {
    return cache.clearAll();
});

//process styles
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

//launch server, wait for reload event
gulp.task('browser-sync', async function () {
    browserSync.init({
        server: {baseDir: 'dist'},
        notify: false,
    });
});

//process vendor styles
gulp.task('styles-vendor', async function () {
    return gulp.src('src/styles/vendor/**/*')
        .pipe(concat('vendor.min.css'))
        .pipe(cleanCSS())
        .pipe(nano())
        .pipe(gulp.dest('dist/styles/'))
});

//process scripts
gulp.task('scripts', async function () {
    var files = glob.sync('src/scripts/*.ts');
    files.map(function (file) {
        return browserify(file, {debug: true})
            .plugin(tsify)
            .transform(babelify.configure({presets: ['@babel/preset-env']}))
            .bundle()
            .pipe(source(path.basename(file, '.ts') + '.js'))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('dist/scripts'))
            .pipe(browserSync.reload({stream: true}));
    });
});

//concat vendor scripts
gulp.task('concat-vendor-scripts', async function () {
    return gulp.src('src/scripts/vendor/*.js')
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/scripts'));
});

//move vendor scripts, that don't need to be concated
gulp.task('move-plugin-scripts', async function () {
    return gulp.src('src/scripts/vendor/plugins/*.js').pipe(gulp.dest('dist/scripts/plugins'));
});

//process vendor scripts
gulp.task('scripts-vendor', gulp.parallel('concat-vendor-scripts', 'move-plugin-scripts'));

//move html pages to dist
gulp.task('html', async function () {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.reload({stream: true}))
});

//watch for updates
gulp.task('watch', async function () {
    gulp.watch('src/**/*.sass', gulp.parallel('styles'));
    gulp.watch('src/*.html', gulp.parallel('html'));
    gulp.watch('src/**/*.js', gulp.parallel('scripts'));
    gulp.watch('src/images/**/*', gulp.parallel('img'));
    gulp.watch('src/fonts/**/*', gulp.parallel('fonts'));
});

//build project
gulp.task('build', gulp.parallel('img', 'fonts', 'styles', 'styles-vendor', 'scripts', 'scripts-vendor', 'html'));

//launch dev environment + watchers
gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));
