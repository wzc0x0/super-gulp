/**
 * Super Gulp
 * 处理css js其他不处理
 */

//development mode will copy origin ./src to ./dev
var gulp = require("gulp"),
    less = require("gulp-less"),
    babel = require("gulp-babel"),
    clean = require("gulp-clean"),
    autoprefixer = require("gulp-autoprefixer"),
    changed = require("gulp-changed"),
    browserSync = require("browser-sync").create(),
    output = {
        src: "./src",
        js: "./src/js/*.js",
        less: "./src/less/*.less",
        dev: "./dev/",
        build: "./dist/",
        port: 2018,
        browserslist: ["> 1%", "last 2 versions", "not ie <= 8"]
    };

//del
gulp.task('delete', function() {
    return gulp.src(output.dev).pipe(clean())
});


//copy all src with no need for less、sass、css、js...
gulp.task('copy', function() {
    return gulp.src([`${output.src}/**/*.*`, `!${output.js}`, `!${output.less}`])
        .pipe(changed(output.dev, { hasChanged: changed.compareSha1Digest }))
        .pipe(gulp.dest(output.dev))
        .pipe(browserSync.reload({ stream: true }));
})


//实时babel编译js
gulp.task('script', function() {
    return gulp.src(output.js)
        .pipe(changed(`${output.dev}/js`, { hasChanged: changed.compareSha1Digest }))
        .pipe(babel({ presets: ["env"] }))
        .pipe(gulp.dest(`${output.dev}/js`))
        .pipe(browserSync.reload({ stream: true }));
});

//实时编译less
gulp.task('less', function() {
    return gulp.src(output.less) //多个文件以数组形式传入
        .pipe(changed(`${output.dev}/css`, { hasChanged: changed.compareSha1Digest }))
        .pipe(less()) //编译less文件
        .pipe(autoprefixer({
            browsers: output.browserslist,
            cascade: false
        }))
        .pipe(gulp.dest(`${output.dev}/css`))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task('default', ['delete'], function() {
    gulp.start('less', 'script', 'copy');
    browserSync.init({
        port: output.port,
        server: { baseDir: [output.dev] }
    });
    gulp.watch([`${output.src}/**/*.*`, `!${output.js}`, `!${output.less}`], ["copy"]);
    gulp.watch(output.less, ['less']);
    gulp.watch(output.js, ['script']);
});

/**
 production mode will copy ./dev to ./dist
 optimize & compress html、js、css
 add assets timestamp
 *
*/

var htmlmin = require("gulp-htmlmin"),
    jsmin = require("gulp-uglify"),
    cssmin = require("gulp-clean-css"),
    assetRev = require("gulp-asset-time"),
    options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
        minifyJS: true, //压缩页面JS
        minifyCSS: true //压缩页面CSS
    };


gulp.task("del-build", function() {
    return gulp.src(output.build).pipe(clean())
})


gulp.task("copy-to-build", ["less", "script", "copy", "del-build"], function() {
    return gulp.src(`${output.dev}**`).pipe(gulp.dest(output.build));
});


gulp.task('html-rev', function() {
    gulp.src([`${output.build}**/*.html`, `${output.build}*.html`])
        .pipe(htmlmin(options))
        .pipe(assetRev())
        .pipe(gulp.dest(output.build))
})

gulp.task('css-rev', function() {
    gulp.src(`${output.build}css/*.css`)
        .pipe(cssmin())
        .pipe(assetRev())
        .pipe(gulp.dest(`${output.build}css`))
})

gulp.task('js-min', function() {
    gulp.src(`${output.build}js/*.js`)
        .pipe(jsmin())
        .pipe(gulp.dest(`${output.build}js`))
})


gulp.task('build', ['copy-to-build'], function() {
    gulp.start('html-rev', 'css-rev', 'js-min')
})