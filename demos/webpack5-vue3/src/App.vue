<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <input type="text" />
  <div @click="count++">{{ count }}</div>
  <HelloWorld msg="Welcome to Your Vue.js App" />
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue';
import { ref, watch } from 'vue';

const count = ref(0);

function getStackTrace() {
  const obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  fetch('https://baidu.com');
  return obj.stack;
}

function exampleFunction() {
  const stackTrace = getStackTrace();
  console.log(stackTrace);
}

watch(
  () => count.value,
  () => {
    exampleFunction();
    console.trace();
  }
);
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
