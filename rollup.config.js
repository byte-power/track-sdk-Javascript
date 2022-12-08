import bable from "rollup-plugin-babel"; // 引入babel插件
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve";
import { uglify } from 'rollup-plugin-uglify'
import json from 'rollup-plugin-json'
export default {
    // 入口文件
    input: 'entry/tracker.js',
    output: {
      // 打包的文件
      file: 'lib/index.js',
      name: 'bundlea',
      // 打包的格式，umd 支持 commonjs/amd/life 三种方式
      format: 'umd',
      // 启用代码映射，便于调试之用
      sourcemap: true
    },
    plugins: [
        commonjs(), // 支持解析CommonJS模块
        resolve(), // 支持从node_modules中引入模块
        bable({ // 添加babel插件
            exclude: "node_modules/**" // 排除node_modules下的文件
        }),
        json(),
        uglify(), // js 压缩插件，需要在最后引入
    ]
}