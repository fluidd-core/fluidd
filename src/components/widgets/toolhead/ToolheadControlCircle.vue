<template>
  <div>
    <v-row>
      <v-col class="pa-0 mt-1">
        <!--
          Inspired on Pronterface and Mainsail Toolhead Circle controls
        -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 426.5 347"
          class="app-circle-control"
          :class="{
            [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
          }"
        >
          <g class="cc-section">
            <a
              class="cc-btn outer"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[3], false)"
            >
              <path
                d="m408.5,121.331V6.998c0-3.313-2.686-5.998-5.998-5.998h-38.003c-3.313,0-5.998,2.686-5.998,5.998v114.333h50Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[3], true)"
            >
              <path
                d="m358.5,221.331v118.664c0,3.316,2.688,6.005,6.005,6.005h37.991c3.316,0,6.005-2.688,6.005-6.005v-118.664h-50Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="zStepClasses"
              transform="translate(382.5, 25.664)"
              text-anchor="middle"
            >
              {{ stepsZ[3] }}
            </text>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn outer-mid"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[2], false)"
            >
              <path
                d="m408.5,38.274c-8.108-1.489-16.462-2.274-25-2.274s-16.892.785-25,2.274v83.057h50V38.274Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer-mid"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[2], true)"
            >
              <path
                d="m358.5,308.726c8.108,1.489,16.462,2.274,25,2.274s16.892-.785,25-2.274v-87.395h-50v87.395Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="zStepClasses"
              transform="translate(382.5, 60.664)"
              text-anchor="middle"
            >
              {{ stepsZ[2] }}
            </text>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn inner-mid"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[1], false)"
            >
              <path
                d="m408.5,74.077c-8.002-2.006-16.376-3.077-25-3.077s-16.998,1.071-25,3.077v47.255h50v-47.255Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner-mid"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[1], true)"
            >
              <path
                d="m358.5,272.923c8.002,2.006,16.376,3.077,25,3.077s16.998-1.071,25-3.077v-51.592h-50v51.592Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="zStepClasses"
              transform="translate(382.5, 95.663)"
              text-anchor="middle"
            >
              {{ stepsZ[1] }}
            </text>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn inner"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[0], false)"
            >
              <path
                d="m383.5,106c-8.836,0-17.266,1.715-25,4.802v26.262c0,.531.211,1.04.586,1.416l6.262,6.262c.621.621,1.584.782,2.351.354,4.677-2.609,10.064-4.096,15.8-4.096s11.123,1.488,15.8,4.096c.767.428,1.73.267,2.351-.354l6.262-6.262c.375-.375.586-.885.586-1.416v-26.262c-7.734-3.087-16.164-4.802-25-4.802Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner"
              :class="zStepClasses"
              @click="moveAxisBy('Z', stepsZ[0], true)"
            >
              <path
                d="m383.5,206c-5.736,0-11.123-1.488-15.8-4.096-.767-.428-1.73-.267-2.351.354l-6.262,6.262c-.375.375-.586.885-.586,1.415v24.87c0,.838.513,1.6,1.298,1.895,7.376,2.77,15.358,4.3,23.702,4.3s16.326-1.53,23.702-4.3c.785-.295,1.298-1.057,1.298-1.895v-24.87c0-.531-.211-1.04-.586-1.415l-6.262-6.262c-.621-.621-1.584-.782-2.351-.354-4.677,2.609-10.064,4.096-15.8,4.096Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="zStepClasses"
              transform="translate(382.5, 130.664)"
              text-anchor="middle"
            >
              {{ stepsZ[0] }}
            </text>
          </g>

          <!--- Z Center -->
          <g>
            <a
              v-if="printerSupportsLeveling"
              class="cc-btn"
              :class="levelingClasses"
              @click="sendLevelingGcode"
            >
              <circle
                cx="383.5"
                cy="173.5"
                r="25"
                class="cc-btn-container"
              />
              <path d="m396.25,169.25v2.833h-25.5v-2.833h25.5Zm-17.657,12.75h9.815l-4.907-8.5-4.907,8.5Z" />
            </a>
            <a
              v-else
              class="cc-btn primary"
              :class="motorsOffClasses"
              @click="sendGcode('M84')"
            >
              <circle
                cx="383.5"
                cy="173.5"
                r="25"
                class="cc-btn-container"
              />
              <path d="m374.356,160.75h19.771c.829.829,1.294,1.294,2.123,2.123v19.771l-2.833-2.833v-15.764l-.463-.463h-15.764l-2.833-2.833Zm15.613,15.613c.389-.877.614-1.842.614-2.863,0-3.912-3.171-7.083-7.083-7.083-1.021,0-1.986.225-2.863.614l2.278,2.278c.193-.027.384-.059.585-.059,2.344,0,4.25,1.906,4.25,4.25,0,.2-.032.392-.059.585l2.278,2.278Zm-3.81-3.81c-.285-.799-.913-1.427-1.712-1.712l1.712,1.712Zm9.03,12.636l1.334,1.334-1.803,1.803-2.076-2.076h-19.771c-.829-.829-1.294-1.294-2.123-2.123v-19.771l-2.076-2.076,1.803-1.803,1.334,1.334,5.607,5.607,1.073,1.073,2.005,2.005,1,1,3.42,3.42,1.587,1.587,2.005,2.005,1.073,1.073,5.607,5.607Zm-15.939-11.689c0,2.343,1.906,4.25,4.25,4.25.2,0,.392-.032.585-.059l-1.532-1.532c-.799-.285-1.427-.913-1.712-1.712l-1.532-1.532c-.027.193-.059.385-.059.585Zm10.56,9.917l-3.448-3.447c-.877.389-1.842.614-2.863.614-3.912,0-7.083-3.171-7.083-7.083,0-1.021.225-1.986.614-2.863l-3.447-3.447v15.764l.463.463h15.764Zm-13.394-4.25c-.782,0-1.417.634-1.417,1.417s.634,1.417,1.417,1.417,1.417-.634,1.417-1.417-.634-1.417-1.417-1.417Zm15.583-12.75c0-.782-.634-1.417-1.417-1.417s-1.417.634-1.417,1.417.634,1.417,1.417,1.417,1.417-.634,1.417-1.417Z" />
            </a>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn outer"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[3], true)"
            >
              <path
                d="m132.727,143.333L49.329,59.936c-1.641-1.641-4.325-1.538-5.85.21C17.028,90.461,1,130.107,1,173.5s16.028,83.039,42.479,113.354c1.525,1.748,4.209,1.85,5.85.21l83.841-83.841c-6.389-8.398-10.188-18.874-10.188-30.24,0-11.101,3.623-21.353,9.744-29.649Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[3], false)"
            >
              <path
                d="m213.239,202.632l84.427,84.427c1.643,1.643,4.332,1.541,5.859-.21,26.449-30.314,42.475-69.958,42.475-113.349s-16.026-83.035-42.475-113.349c-1.528-1.751-4.216-1.853-5.859-.21l-83.997,83.997c5.856,8.189,9.314,18.21,9.314,29.045,0,11.101-3.623,21.353-9.744,29.65Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[3], false)"
            >
              <path
                d="m143.333,132.727c8.297-6.121,18.548-9.744,29.65-9.744,11.366,0,21.842,3.799,30.24,10.188l83.834-83.834c1.644-1.644,1.542-4.335-.21-5.863C256.533,17.025,216.89,1,173.5,1S90.467,17.025,60.153,43.473c-1.752,1.529-1.855,4.219-.21,5.863l83.39,83.39Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[3], true)"
            >
              <path
                d="m204.986,215.593c-1.345-1.345-3.435-1.534-5.036-.506-7.781,4.995-17.034,7.896-26.967,7.896-9.684,0-18.718-2.762-26.374-7.53-1.597-.995-3.66-.795-4.991.536l-81.674,81.674c-1.644,1.644-1.542,4.335.21,5.864,30.314,26.448,69.957,42.473,113.346,42.473s83.032-16.025,113.346-42.473c1.752-1.529,1.855-4.22.21-5.864l-82.071-82.071Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="xyStepClasses"
              transform="translate(173.5, 25.664)"
              text-anchor="middle"
            >
              {{ stepsXY[3] }}
            </text>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn outer-mid"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[2], true)"
            >
              <path
                d="m132.727,143.333l-61.608-61.608c-21.833,24.34-35.119,56.504-35.119,91.774s13.286,67.435,35.119,91.774l62.052-62.052c-6.389-8.398-10.188-18.874-10.188-30.24,0-11.101,3.623-21.353,9.744-29.649Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer-mid"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[2], false)"
            >
              <path
                d="m213.239,202.632l62.642,62.642c21.833-24.34,35.119-56.504,35.119-91.774s-13.286-67.435-35.119-91.774l-62.212,62.212c5.856,8.189,9.314,18.21,9.314,29.045,0,11.101-3.623,21.353-9.744,29.65Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer-mid"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[2], false)"
            >
              <path
                d="m143.333,132.727c8.297-6.121,18.548-9.744,29.65-9.744,11.366,0,21.842,3.799,30.24,10.188l62.052-62.052c-24.34-21.833-56.504-35.119-91.774-35.119s-67.435,13.286-91.774,35.119l61.608,61.608Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn outer-mid"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[2], true)"
            >
              <path
                d="m202.632,213.239c-8.296,6.121-18.548,9.744-29.65,9.744-10.835,0-20.856-3.458-29.045-9.314l-62.212,62.212c24.34,21.833,56.504,35.119,91.774,35.119s67.435-13.286,91.775-35.119l-62.642-62.642Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="xyStepClasses"
              transform="translate(173.5, 60.664)"
              text-anchor="middle"
            >
              {{ stepsXY[2] }}
            </text>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn inner-mid"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[1], true)"
            >
              <path
                d="m132.727,143.333l-36.814-36.814c-15.523,17.965-24.912,41.376-24.912,66.981s9.39,49.016,24.912,66.981l37.258-37.258c-6.389-8.398-10.188-18.874-10.188-30.24,0-11.101,3.623-21.353,9.744-29.649Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner-mid"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[1], false)"
            >
              <path
                d="m213.239,202.632l37.849,37.849c15.523-17.965,24.912-41.376,24.912-66.981s-9.39-49.016-24.912-66.981l-37.419,37.419c5.856,8.189,9.314,18.21,9.314,29.045,0,11.101-3.623,21.353-9.744,29.65Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner-mid"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[1], false)"
            >
              <path
                d="m143.333,132.727c8.297-6.121,18.548-9.744,29.65-9.744,11.366,0,21.842,3.799,30.24,10.188l37.258-37.258c-17.965-15.523-41.376-24.912-66.981-24.912s-49.016,9.39-66.981,24.912l36.814,36.814Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner-mid"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[1], true)"
            >
              <path
                d="m202.632,213.239c-8.296,6.121-18.548,9.744-29.65,9.744-10.835,0-20.856-3.458-29.045-9.314l-37.419,37.419c17.965,15.523,41.376,24.912,66.981,24.912s49.016-9.39,66.981-24.912l-37.849-37.849Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="xyStepClasses"
              transform="translate(173.5, 95.664)"
              text-anchor="middle"
            >
              {{ stepsXY[1] }}
            </text>
          </g>

          <g class="cc-section">
            <a
              class="cc-btn inner"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[0], true)"
            >
              <path
                d="m144.743,155.35l-23.97-23.97c-9.237,11.547-14.773,26.184-14.773,42.121s5.536,30.573,14.773,42.121l23.97-23.97c.621-.621.782-1.584.354-2.351-2.608-4.677-4.097-10.064-4.097-15.799s1.489-11.122,4.098-15.799c.428-.767.267-1.73-.354-2.351Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner"
              :class="xStepClasses"
              @click="moveAxisBy('X', stepsXY[0], false)"
            >
              <path
                d="m202.257,191.65l23.97,23.97c9.237-11.547,14.773-26.184,14.773-42.121s-5.536-30.573-14.773-42.121l-23.97,23.97c-.621.621-.782,1.584-.354,2.351,2.608,4.677,4.097,10.064,4.097,15.799s-1.489,11.122-4.097,15.799c-.428.767-.267,1.73.354,2.351Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[0], false)"
            >
              <path
                d="m155.35,144.743c.621.621,1.584.782,2.351.354,4.677-2.608,10.064-4.097,15.799-4.097s11.122,1.489,15.799,4.097c.767.428,1.73.267,2.351-.354l23.97-23.97c-11.547-9.237-26.184-14.773-42.121-14.773s-30.573,5.536-42.121,14.773l23.97,23.97Z"
                class="cc-btn-container"
              />
            </a>

            <a
              class="cc-btn inner"
              :class="yStepClasses"
              @click="moveAxisBy('Y', stepsXY[0], true)"
            >
              <path
                d="m191.65,202.257c-.621-.621-1.584-.782-2.351-.354-4.677,2.608-10.064,4.098-15.799,4.098s-11.122-1.489-15.799-4.098c-.767-.428-1.73-.267-2.351.354l-23.97,23.97c11.547,9.237,26.184,14.773,42.121,14.773s30.573-5.536,42.121-14.773l-23.97-23.97Z"
                class="cc-btn-container"
              />
            </a>

            <text
              class="cc-lbl"
              :class="xyStepClasses"
              transform="translate(173.5, 130.664)"
              text-anchor="middle"
            >
              {{ stepsXY[0] }}
            </text>
          </g>

          <!--- XY Center -->
          <g>
            <a
              v-if="!enableXYHoming"
              class="cc-btn"
              :class="centerToolheadClasses"
              @click="sendMoveCenterGcode()"
            >
              <circle
                cx="173.5"
                cy="173.5"
                r="25"
                class="cc-btn-container"
              />
              <path d="m174.917,174.917v4.25h-2.833v-4.25h-4.25v-2.833h4.25v-4.25h2.833v4.25h4.25v2.833h-4.25Zm-11.333-11.333h5.667v-2.833h-5.664c-1.566,0-2.836,1.27-2.836,2.836v5.664h2.833v-5.667Zm19.831-2.833h-5.664v2.833h5.667v5.667h2.833v-5.664c0-1.566-1.27-2.836-2.836-2.836Zm.002,22.667h-5.667v2.833h5.664c1.566,0,2.836-1.27,2.836-2.836v-5.664h-2.833v5.667Zm-19.833-5.667h-2.833v5.664c0,1.566,1.27,2.836,2.836,2.836h5.664v-2.833h-5.667v-5.667Z" />
            </a>

            <a
              v-else
              class="cc-btn"
              :class="xyzHomeClasses"
              @click="homeAll"
            >
              <circle
                cx="173.5"
                cy="173.5"
                r="25"
                class="cc-btn-container"
              />
              <path d="m170.667,184.833v-8.5h5.667v8.5h7.083v-11.333h4.25l-14.167-12.75-14.167,12.75h4.25v11.333h7.083Z" />
            </a>
          </g>

          <!-- Homing Buttons -->
          <g>
            <!-- Home X -->
            <a
              class="cc-btn large"
              :class="xHomeClasses"
              @click="sendGcode('G28 X', $waits.onHomeX)"
            >
              <path
                d="m63.219,8.5H14.495c-3.311,0-5.995,2.684-5.995,5.995v48.724c0,5.851,7.555,8.259,10.892,3.454,12.807-18.441,28.839-34.473,47.28-47.28,4.805-3.337,2.397-10.892-3.454-10.892Z"
                class="cc-btn-container"
              />
              <path d="m19.833,28.167v-5h3.333v5h4.167v-6.667h2.5l-8.333-7.5-8.333,7.5h2.5v6.667h4.167Z" />
              <text transform="translate(31.671 28.167)">X</text>
            </a>

            <!-- Home Y -->
            <a
              class="cc-btn large"
              :class="yHomeClasses"
              @click="sendGcode('G28 Y', $waits.onHomeX)"
            >
              <path
                d="m338.5,63.219V14.495c0-3.311-2.684-5.995-5.995-5.995h-48.724c-5.851,0-8.259,7.555-3.454,10.892,18.441,12.807,34.473,28.839,47.28,47.28,3.337,4.805,10.892,2.397,10.892-3.454Z"
                class="cc-btn-container"
              />
              <path d="m323.833,28.167v-5h3.333v5h4.167v-6.667h2.5l-8.333-7.5-8.333,7.5h2.5v6.667h4.167Z" />
              <text
                text-anchor="end"
                transform="translate(315.329 28.167)"
              >Y</text>
            </a>

            <!-- Home Z -->
            <a
              class="cc-btn large"
              :class="zHomeClasses"
              @click="sendGcode('G28 Z', $waits.onHomeZ)"
            >
              <path
                d="m283.781,338.5h48.724c3.311,0,5.995-2.684,5.995-5.995v-48.724c0-5.851-7.555-8.259-10.892-3.454-12.807,18.441-28.839,34.473-47.28,47.28-4.805,3.337-2.397,10.892,3.454,10.892Z"
                class="cc-btn-container"
              />
              <path d="m323.833,332.167v-5h3.333v5h4.167v-6.667h2.5l-8.333-7.5-8.333,7.5h2.5v6.667h4.167Z" />
              <text
                transform="translate(315.329 332.167)"
                text-anchor="end"
              >Z</text>
            </a>

            <!-- Home XY -->
            <a
              v-if="enableXYHoming"
              class="cc-btn large"
              :class="xyHomeClasses"
              @click="sendGcode('G28 X Y', $waits.onHomeXY)"
            >
              <path
                d="m8.5,283.781v48.724c0,3.311,2.684,5.995,5.995,5.995h48.724c5.851,0,8.259-7.555,3.454-10.892-18.441-12.807-34.473-28.839-47.28-47.28-3.337-4.805-10.892-2.397-10.892,3.454Z"
                class="cc-btn-container"
              />
              <path d="m19.833,332.167v-5h3.333v5h4.167v-6.667h2.5l-8.333-7.5-8.333,7.5h2.5v6.667h4.167Z" />
              <text transform="translate(31.671 332.167)">XY</text>
            </a>

            <!-- Home All -->
            <a
              v-else
              class="cc-btn large"
              :class="xyzHomeClasses"
              @click="homeAll"
            >
              <path
                d="m8.5,283.781v48.724c0,3.311,2.684,5.995,5.995,5.995h48.724c5.851,0,8.259-7.555,3.454-10.892-18.441-12.807-34.473-28.839-47.28-47.28-3.337-4.805-10.892-2.397-10.892,3.454Z"
                class="cc-btn-container"
              />
              <path d="m23.167,330.833v-7h4.667v7h5.833v-9.333h3.5l-11.667-10.5-11.667,10.5h3.5v9.333h5.833Z" />
            </a>
          </g>
        </svg>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import type { BedSize } from '@/store/printer/types'

type Axis = 'X' | 'Y' | 'Z'

@Component({})
export default class ToolheadControlCircle extends Mixins(StateMixin, ToolheadMixin) {
  get enableXYHoming (): boolean {
    return this.$store.state.config.uiSettings.general.toolheadCircleXYHomingEnabled as boolean
  }

  get stepsXY (): number[] {
    return this.$store.state.config.uiSettings.general.toolheadCircleXYMoveDistances as number[]
  }

  get stepsZ (): number[] {
    return this.$store.state.config.uiSettings.general.toolheadCircleZMoveDistances as number[]
  }

  get forceMove () {
    return this.$store.state.config.uiSettings.toolhead.forceMove
  }

  get hasSteppersEnabled (): boolean {
    return this.$store.getters['printer/getHasSteppersEnabled'] as boolean
  }

  get printerSettings () {
    return this.$store.getters['printer/getPrinterSettings']()
  }

  get printerSupportsQuadGantryLevel (): boolean {
    return 'quad_gantry_level' in this.printerSettings
  }

  get printerSupportsZTiltAdjust (): boolean {
    return 'z_tilt' in this.printerSettings
  }

  get printerSupportsLeveling (): boolean {
    return (
      this.printerSupportsQuadGantryLevel ||
      this.printerSupportsZTiltAdjust
    )
  }

  get xStepClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !this.xHomed
      )
    }
  }

  get yStepClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !this.yHomed
      )
    }
  }

  get zStepClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !this.zHomed
      )
    }
  }

  get xyStepClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !(this.xHomed || this.yHomed)
      )
    }
  }

  get xHomeClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        this.hasWait([this.$waits.onHomeX, this.$waits.onHomeXY, this.$waits.onHomeAll])
      ),
      primary: !this.xHomed
    }
  }

  get yHomeClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        this.hasWait([this.$waits.onHomeY, this.$waits.onHomeXY, this.$waits.onHomeAll])
      ),
      primary: !this.yHomed
    }
  }

  get zHomeClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        this.hasWait([this.$waits.onHomeZ, this.$waits.onHomeAll])
      ),
      primary: !this.zHomed
    }
  }

  get xyHomeClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        this.hasWait([this.$waits.onHomeX, this.$waits.onHomeY, this.$waits.onHomeXY, this.$waits.onHomeAll])
      ),
      primary: !this.xyHomed
    }
  }

  get xyzHomeClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        this.hasWait([this.$waits.onHomeX, this.$waits.onHomeY, this.$waits.onHomeZ, this.$waits.onHomeXY, this.$waits.onHomeAll])
      ),
      primary: !this.allHomed
    }
  }

  get centerToolheadClasses () {
    const tool_pos = this.$store.state.printer.printer.toolhead.position
    const bedCenter = this.bedCenter

    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !this.xyHomed
      ),
      primary: !(
        tool_pos[0] === bedCenter.x &&
        tool_pos[1] === bedCenter.y
      )
    }
  }

  get levelingClasses () {
    const [primary, disabled] = this.printerSupportsQuadGantryLevel
      ? [
          !this.$store.state.printer.printer.quad_gantry_level?.applied,
          this.hasWait(this.$waits.onQGL)
        ]
      : this.printerSupportsZTiltAdjust
        ? [
            !this.$store.state.printer.printer.z_tilt?.applied,
            this.hasWait(this.$waits.onZTilt)
          ]
        : []

    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !this.allHomed ||
        disabled
      ),
      primary
    }
  }

  get motorsOffClasses () {
    return {
      disabled: (
        !this.klippyReady ||
        this.printerPrinting ||
        !this.hasSteppersEnabled
      )
    }
  }

  sendLevelingGcode () {
    if (this.printerSupportsQuadGantryLevel) {
      this.sendGcode('QUAD_GANTRY_LEVEL', this.$waits.onQGL)
    } else if (this.printerSupportsZTiltAdjust) {
      this.sendGcode('Z_TILT_ADJUST', this.$waits.onZTilt)
    }
  }

  moveAxisBy (axis: Axis, distance: number, negative = false) {
    const rate = axis === 'Z'
      ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
      : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
    const inverted = this.$store.state.config.uiSettings.general.axis[axis.toLowerCase()].inverted || false
    distance = negative !== inverted
      ? -distance
      : distance

    if (this.forceMove) {
      const accel = axis === 'Z'
        ? this.$store.getters['printer/getPrinterSettings']('printer.max_z_accel')
        : this.$store.state.printer.printer.toolhead.max_accel
      this.sendGcode(`FORCE_MOVE STEPPER=stepper_${axis.toLowerCase()} DISTANCE=${distance} VELOCITY=${rate} ACCEL=${accel}`)
    } else {
      this.sendMoveGcode(`${axis}${distance}`, rate)
    }
  }

  get bedSize (): BedSize {
    const bedSize = this.$store.getters['printer/getBedSize'] as BedSize | undefined

    return bedSize ?? {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    }
  }

  get bedCenter () {
    const bedSize = this.bedSize

    return {
      x: (bedSize.maxX - bedSize.minX) / 2,
      y: (bedSize.maxY - bedSize.minY) / 2
    }
  }

  sendMoveCenterGcode () {
    const bedCenter = this.bedCenter
    const rate = this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed

    this.sendMoveGcode(`X${bedCenter.x} Y${bedCenter.y}`, rate, true)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  @include theme(app-circle-control) using ($material) {
    .disabled {
      fill: map-deep-get($material, 'buttons', 'disabled') !important;
      stroke: map-deep-get($material, 'buttons', 'disabled') !important;
    }

    .cc-btn,
    .cc-lbl {
      fill: map-deep-get($material, 'text', 'primary');
      stroke: map-deep-get($material, 'text', 'primary');
    }
  }

  @mixin cc-btn-theme ($component, $text, $back, $hover) {
    &#{$component} {
      fill: #{$text};
      stroke: #{$text};

      .cc-btn-container {
        fill: #{$back};
      }

      &:hover .cc-btn-container {
        fill: #{$hover};
      }
    }
  }

  .theme--light.app-circle-control .cc-btn {
    @include cc-btn-theme('.inner', '', 'var(--v-btncolor-lighten1)', '');
    @include cc-btn-theme('.inner-mid', '', 'var(--v-btncolor-base)', '');
    @include cc-btn-theme('.outer-mid', '', 'var(--v-btncolor-darken1)', '');
    @include cc-btn-theme('.outer', '', 'var(--v-btncolor-darken2)', '');
  }

  .theme--dark.app-circle-control .cc-btn {
    @include cc-btn-theme('.inner', '', 'var(--v-btncolor-lighten2)', '');
    @include cc-btn-theme('.inner-mid', '', 'var(--v-btncolor-lighten1)', '');
    @include cc-btn-theme('.outer-mid', '', 'var(--v-btncolor-base)', '');
    @include cc-btn-theme('.outer', '', 'var(--v-btncolor-darken1)', '');
  }

  .app-circle-control {
    font-size: 16px;
    max-height: 350px;
    min-height: 275px;
    user-select: none;
    filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.2)) drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.14)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.12));

    .cc-btn {
      stroke-width: 0;

      .cc-btn-container {
        fill: var(--v-btncolor-base);
        stroke: var(--v-btncolor-darken4);
        stroke-width: 1px;
        transition-duration: 0.28s;
        transition-property: fill;
        transition-timing-function: map-get($transition, 'fast-out-slow-in');
      }

      &:hover .cc-btn-container {
        fill: var(--v-btncolor-lighten1);
      }

      &:not(.disabled) {
        $material-dark-text-primary: map-deep-get($material-dark, 'text', 'primary');

        @include cc-btn-theme(
          '.primary',
          $material-dark-text-primary,
          'var(--v-primary-base)',
          'var(--v-primary-lighten1)');

        @include cc-btn-theme(
          '.inner',
          $material-dark-text-primary,
          'var(--v-primary-lighten1)',
          'var(--v-primary-lighten2)');

        @include cc-btn-theme(
          '.inner-mid',
          $material-dark-text-primary,
          'var(--v-primary-base)',
          'var(--v-primary-lighten1)');

        @include cc-btn-theme(
          '.outer-mid',
          $material-dark-text-primary,
          'var(--v-primary-darken1)',
          'var(--v-primary-base)');

        @include cc-btn-theme(
          '.outer',
          $material-dark-text-primary,
          'var(--v-primary-darken2)',
          'var(--v-primary-darken1)');
      }
    }

    .cc-section:hover .cc-lbl {
      font-weight: bold;
    }

    .cc-lbl {
      pointer-events: none;
      stroke-width: 0;
    }

    .large {
      font-weight: bold;
    }

    .disabled {
      pointer-events: none;
    }
  }
</style>
