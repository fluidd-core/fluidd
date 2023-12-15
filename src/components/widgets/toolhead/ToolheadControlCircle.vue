<template>
  <div>
    <v-row>
      <v-col class="pa-0 mt-1">
        <!--
          SVG assets from Mainsail Toolhead Circle Control, rest of control
          adapted for Fluidd from https://github.com/mainsail-crew/mainsail/blob/develop/src/components/panels/ToolheadControls/CircleControl.vue
        -->
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 78 62"
          xmlns="http://www.w3.org/2000/svg"
          style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2"
          class="app-circle-control"
          :class="{
            [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
          }"
        >
          <defs>
            <path
              id="pathHomeButtonTop"
              d="M9.188,-0C9.634,0.001 10.028,0.291 10.162,0.717C10.295,1.142 10.136,1.605 9.77,1.86C6.722,4.035 4.05,6.701 1.869,9.743C1.614,10.11 1.151,10.269 0.724,10.135C0.298,10.002 0.008,9.607 0.008,9.16C0,6.418 0,2.781 0,1.029C-0,0.756 0.108,0.495 0.302,0.302C0.495,0.108 0.756,-0 1.029,0L9.188,-0Z"
            />
            <path
              id="pathHomeButtonBottom"
              d="M9.188,0C9.634,0.001 10.028,0.291 10.162,0.717C10.295,1.142 10.136,1.605 9.77,1.86C6.722,4.035 4.05,6.701 1.869,9.743C1.614,10.11 1.151,10.269 0.724,10.135C0.298,10.002 0.008,9.607 0.008,9.16C0,6.418 0,2.781 0,1.029C-0,0.756 0.108,0.495 0.302,0.302C0.495,0.108 0.756,-0 1.029,0L9.188,0Z"
            />
            <path
              id="homeIcon"
              d="M10,20L10,14L14,14L14,20L19,20L19,12L22,12L12,3L2,12L5,12L5,20L10,20Z"
              style="fill-rule: nonzero"
            />
            <path
              id="xyStepOuter"
              d="M43.181,8.535C43.262,8.453 43.373,8.409 43.488,8.412C43.602,8.415 43.711,8.466 43.787,8.551C47.661,12.933 50,18.695 50,25C50,31.291 47.672,37.042 43.811,41.42C43.735,41.505 43.627,41.556 43.512,41.559C43.398,41.562 43.287,41.518 43.206,41.437C42.343,40.575 39.981,38.213 39.981,38.213C43.11,34.7 45,30.069 45,25C45,19.918 43.1,15.276 39.956,11.759C39.956,11.759 42.319,9.397 43.181,8.535Z"
            />
            <path
              id="xyStepOuterMid"
              d="M47.418,4.777C57.663,18.688 57.829,31.029 47.304,45.072L39.308,37.098C42.081,33.838 43.75,29.612 43.75,25C43.75,20.371 42.069,16.132 39.277,12.868L47.418,4.777Z"
            />
            <path
              id="xyStepInnerMid"
              d="M54.897,-1.964C68.991,16.277 68.542,32.764 54.738,51.763L44.077,41.131L38.115,35.169C40.361,32.389 41.667,28.846 41.667,25C41.667,21.132 40.346,17.57 38.076,14.784L54.897,-1.964Z"
            />
            <path
              id="xyStepInner"
              d="M36.096,19.243C35.88,18.839 35.954,18.342 36.278,18.019C40.686,13.619 69.84,-15.445 69.84,-15.445C90.891,13.786 89.845,38.467 69.564,65.144C69.564,65.144 40.684,36.265 36.318,31.899C35.996,31.576 35.922,31.081 36.134,30.678C37.008,28.975 37.5,27.044 37.5,25C37.5,22.925 36.993,20.967 36.096,19.243Z"
            />
            <path
              id="zStepOuter"
              d="M66.037,2.5C66.037,1.672 66.709,1 67.537,1L74.537,1C75.365,1 76.037,1.672 76.037,2.5L76.037,7.521C74.428,7.179 72.759,7 71.048,7C69.33,7 67.654,7.181 66.037,7.525L66.037,2.5Z"
            />
            <path
              id="zStepOuterMid"
              d="M66.037,7.221C69.367,6.597 72.7,6.583 76.037,7.192L76.037,13.702C74.453,13.245 72.778,13 71.048,13C69.309,13 67.627,13.247 66.037,13.708L66.037,7.221Z"
            />
            <path
              id="zStepInnerMid"
              d="M66.037,13.244C69.353,12.66 72.687,12.7 76.037,13.355L76.037,20.099C74.523,19.39 72.831,19 71.048,19C69.256,19 67.556,19.393 66.037,20.109L66.037,13.244Z"
            />
            <path
              id="zStepInner"
              d="M66.037,19.186C69.409,18.542 72.742,18.52 76.037,19.102L76.037,23.682C76.037,23.815 75.984,23.942 75.891,24.036C75.564,24.362 74.774,25.153 74.359,25.567C74.204,25.722 73.967,25.757 73.773,25.656C72.955,25.236 72.029,25 71.048,25C70.051,25 69.112,25.243 68.284,25.674C68.09,25.777 67.852,25.742 67.697,25.586C67.283,25.175 66.506,24.395 66.183,24.071C66.09,23.977 66.037,23.85 66.037,23.718C66.037,22.806 66.037,19.186 66.037,19.186Z"
            />
          </defs>
          <g transform="matrix(1.24239,0,0,1,0,0)">
            <g transform="matrix(0.804902,0,0,1,0.0430241,0)">

              <!-- HOME X BUTTON -->
              <a
                class="cc-btn large"
                :class="xHomeClasses"
                @click="sendGcode('G28 X', $waits.onHomeX)"
              >
                <g transform="matrix(0.707107,-0.707107,0.707107,0.707107,-1.41799,4.05689)">
                  <g transform="matrix(0.68689,0.68689,-0.68689,0.68689,3.87132,0.962447)">
                    <use
                      class="cc-btn-container"
                      href="#pathHomeButtonTop"
                    />
                  </g>
                  <g transform="matrix(0.654426,0,0,0.654426,0.298666,4.01315)">
                    <text
                      x="3.789px"
                      y="6.089px"
                    >X</text>
                  </g>
                  <g transform="matrix(0.147059,0,0,0.147059,2.10662,2.08254)">
                    <use href="#homeIcon" />
                  </g>
                </g>
              </a>

              <!-- HOME Y BUTTON -->
              <a
                class="cc-btn large"
                :class="yHomeClasses"
                @click="sendGcode('G28 Y', $waits.onHomeY)"
              >
                <g transform="matrix(0.707107,0.707107,-0.707107,0.707107,57.8807,-1.41799)">
                  <g transform="matrix(0.68689,0.68689,-0.68689,0.68689,3.87132,0.962447)">
                    <use
                      class="cc-btn-container"
                      href="#pathHomeButtonTop"
                    />
                  </g>
                  <g transform="matrix(0.654426,0,0,0.654426,0.298666,4.01315)">
                    <text
                      x="3.789px"
                      y="6.089px"
                    >Y</text>
                  </g>
                  <g transform="matrix(0.147059,0,0,0.147059,2.10662,2.08254)">
                    <use href="#homeIcon" />
                  </g>
                </g>
              </a>

              <!-- HOME Z BUTTON -->
              <a
                class="cc-btn large"
                :class="zHomeClasses"
                @click="sendGcode('G28 Z', $waits.onHomeZ)"
              >
                <g transform="matrix(-0.707107,0.707107,-0.707107,-0.707107,63.3555,57.8807)">
                  <g transform="matrix(0.68689,0.68689,-0.68689,0.68689,3.87132,0.962447)">
                    <use
                      class="cc-btn-container"
                      href="#pathHomeButtonBottom"
                    />
                  </g>
                  <g transform="matrix(0.654426,0,0,0.654426,0.298666,4.01315)">
                    <text
                      x="3.93px"
                      y="6.089px"
                    >Z</text>
                  </g>
                  <g transform="matrix(0.147059,0,0,0.147059,2.10662,2.08254)">
                    <use href="#homeIcon" />
                  </g>
                </g>
              </a>

              <!-- HOME XY BUTTON -->
              <a
                v-if="enableXYHoming"
                class="cc-btn large"
                :class="xyHomeClasses"
                @click="sendGcode('G28 X Y', $waits.onHomeXY)"
              >
                <g transform="matrix(-0.707107,-0.707107,0.707107,-0.707107,4.05689,63.3555)">
                  <g transform="matrix(0.68689,0.68689,-0.68689,0.68689,3.87132,0.962447)">
                    <use
                      class="cc-btn-container"
                      href="#pathHomeButtonBottom"
                    />
                  </g>
                  <g transform="matrix(0.654426,0,0,0.654426,0.298666,4.01315)">
                    <text
                      x="2.3px"
                      y="6.089px"
                    >XY</text>
                  </g>
                  <g transform="matrix(0.147059,0,0,0.147059,2.10662,2.08254)">
                    <use href="#homeIcon" />
                  </g>
                </g>
              </a>

              <!-- HOME ALL BUTTON -->
              <a
                v-else
                class="cc-btn large"
                :class="xyzHomeClasses"
                @click="sendGcode('G28', $waits.onHomeAll)"
              >
                <g transform="matrix(-0.707107,-0.707107,0.707107,-0.707107,4.05689,63.3555)">
                  <g transform="matrix(0.68689,0.68689,-0.68689,0.68689,3.87132,0.962447)">
                    <use
                      class="cc-btn-container"
                      href="#pathHomeButtonBottom"
                    />
                  </g>
                  <g transform="matrix(0.29377,0,0,0.29377,0.346087,1.64241)">
                    <use href="#homeIcon" />
                  </g>
                </g>
              </a>

              <!-- CENTER BUTTON IN THE CENTER -->
              <a
                v-if="!enableXYHoming"
                class="cc-btn"
                :class="centerToolheadClasses"
                @click="sendMoveCenterGcode()"
              >
                <g>
                  <circle
                    class="cc-btn-container"
                    cx="31"
                    cy="31"
                    r="5"
                  />
                </g>
                <g transform="scale(0.3) translate(91.25,91.25)">
                  <path
                    d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15 M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    fill="none"
                  />
                </g>
              </a>

              <!-- HOME ALL BUTTON IN THE CENTER -->
              <a
                v-else
                class="cc-btn"
                :class="xyzHomeClasses"
                @click="sendGcode('G28', $waits.onHomeAll)"
              >
                <g>
                  <circle
                    class="cc-btn-container"
                    cx="31"
                    cy="31"
                    r="5"
                  />
                </g>
                <g transform="scale(0.3) translate(91.25,91.25)">
                  <use href="#homeIcon" />
                </g>
              </a>
            </g>

            <g transform="matrix(0.804902,0,0,1,0.0430241,0)">

              <!-- Z STEPS BUTTONS -->
              <g transform="matrix(1.24239,0,0,1,-0.0534526,0)">
                <g
                  transform="matrix(-1,-1.52149e-16,9.85721e-17,-1,114.34,62)"
                >
                  <a
                    class="cc-btn inner"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[0], true)"
                  >
                    <g transform="matrix(0.804902,0,0,1,0,0)">
                      <use
                        class="cc-btn-container"
                        href="#zStepInner"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn inner-mid"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[1], true)"
                  >
                    <g transform="matrix(0.804902,1.2326e-32,-9.92118e-33,1,-5.71917e-15,-7.10543e-15)">
                      <use
                        class="cc-btn-container"
                        href="#zStepInnerMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer-mid"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[2], true)"
                  >
                    <g transform="matrix(0.804902,0,0,1,0,0)">
                      <use
                        class="cc-btn-container"
                        href="#zStepOuterMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[3], true)"
                  >
                    <g transform="matrix(0.804902,0,0,1,0,0)">
                      <use
                        class="cc-btn-container"
                        href="#zStepOuter"
                      />
                    </g>
                  </a>
                </g>
                <g :class="zStepClasses">
                  <a
                    class="cc-btn inner"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[0], false)"
                  >
                    <g transform="matrix(0.804902,0,0,1,0,0)">
                      <use
                        class="cc-btn-container"
                        href="#zStepInner"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn inner-mid"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[1], false)"
                  >
                    <g transform="matrix(0.804902,1.2326e-32,-9.92118e-33,1,-5.71917e-15,-7.10543e-15)">
                      <use
                        class="cc-btn-container"
                        href="#zStepInnerMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer-mid"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[2], false)"
                  >
                    <g transform="matrix(0.804902,0,0,1,0,0)">
                      <use
                        class="cc-btn-container"
                        href="#zStepOuterMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer"
                    :class="zStepClasses"
                    @click="sendMoveGcode('Z', stepsZ[3], false)"
                  >
                    <g transform="matrix(0.804902,0,0,1,0,0)">
                      <use
                        class="cc-btn-container"
                        href="#zStepOuter"
                      />
                    </g>
                  </a>
                </g>
              </g>

              <!-- Z STEP BUTTON TEXT -->
              <g
                class="cc-lbls"
                :class="zStepClasses"
                transform="matrix(1,0,0,1,40,0)"
              >
                <g transform="matrix(1,0,0,1,0.483899,4.07983)">
                  <text
                    x="30.7px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsZ[0] }}
                  </text>
                </g>
                <g transform="matrix(1,0,0,1,0.220227,-1.95729)">
                  <text
                    x="30.7px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsZ[1] }}
                  </text>
                </g>
                <g transform="matrix(1,0,0,1,0.220227,-7.99441)">
                  <text
                    x="30.7px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsZ[2] }}
                  </text>
                </g>
                <g transform="matrix(1,0,0,1,0.220227,-14.0315)">
                  <text
                    x="30.7px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsZ[3] }}
                  </text>
                </g>
              </g>

              <!-- XY STEP BUTTONS -->
              <g>
                <g>
                  <a
                    class="cc-btn inner"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[0], false)"
                  >
                    <g transform="matrix(0.48,0,0,0.48,19,19)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInner"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn inner-mid"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[1], false)"
                  >
                    <g transform="matrix(0.72,0,0,0.72,13,13)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInnerMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer-mid"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[2], false)"
                  >
                    <g transform="matrix(0.96,0,0,0.96,7,7)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuterMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[3], false)"
                  >
                    <g transform="matrix(1.2,0,0,1.2,1,1)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuter"
                      />
                    </g>
                  </a>
                </g>
                <g transform="matrix(-1,-1.22465e-16,1.22465e-16,-1,61.9767,61.9767)">
                  <a
                    class="cc-btn inner"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[0], true)"
                  >
                    <g transform="matrix(0.48,0,0,0.48,19,19)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInner"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn inner-mid"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[1], true)"
                  >
                    <g transform="matrix(0.72,0,0,0.72,13,13)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInnerMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer-mid"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[2], true)"
                  >
                    <g transform="matrix(0.96,0,0,0.96,7,7)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuterMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer"
                    :class="xStepClasses"
                    @click="sendMoveGcode('X', stepsXY[3], true)"
                  >
                    <g transform="matrix(1.2,0,0,1.2,1,1)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuter"
                      />
                    </g>
                  </a>
                </g>
                <g transform="matrix(6.12323e-17,1,-1,6.12323e-17,61.9767,-1.77705e-14)">
                  <a
                    class="cc-btn inner"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[0], true)"
                  >
                    <g transform="matrix(0.48,0,0,0.48,19,19)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInner"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn inner-mid"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[1], true)"
                  >
                    <g transform="matrix(0.72,0,0,0.72,13,13)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInnerMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer-mid"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[2], true)"
                  >
                    <g transform="matrix(0.96,0,0,0.96,7,7)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuterMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[3], true)"
                  >
                    <g transform="matrix(1.2,0,0,1.2,1,1)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuter"
                      />
                    </g>
                  </a>
                </g>
                <g transform="matrix(6.12323e-17,-1,1,6.12323e-17,7.10543e-15,61.9767)">
                  <a
                    class="cc-btn inner"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[0], false)"
                  >
                    <g transform="matrix(0.48,0,0,0.48,19,19)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInner"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn inner-mid"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[1], false)"
                  >
                    <g transform="matrix(0.72,0,0,0.72,13,13)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepInnerMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer-mid"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[2], false)"
                  >
                    <g transform="matrix(0.96,0,0,0.96,7,7)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuterMid"
                      />
                    </g>
                  </a>
                  <a
                    class="cc-btn outer"
                    :class="yStepClasses"
                    @click="sendMoveGcode('Y', stepsXY[3], false)"
                  >
                    <g transform="matrix(1.2,0,0,1.2,1,1)">
                      <use
                        class="cc-btn-container"
                        href="#xyStepOuter"
                      />
                    </g>
                  </a>
                </g>
              </g>

              <!-- XY STEP BUTTON TEXT -->
              <g
                :class="xyStepClasses"
                class="cc-lbls"
              >
                <g transform="matrix(1,0,0,1,0.483899,4.07983)">
                  <text
                    x="30.5px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsXY[0] }}
                  </text>
                </g>
                <g transform="matrix(1,0,0,1,0.220227,-1.95729)">
                  <text
                    x="30.5px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsXY[1] }}
                  </text>
                </g>
                <g transform="matrix(1,0,0,1,0.220227,-7.99441)">
                  <text
                    x="30.5px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsXY[2] }}
                  </text>
                </g>
                <g transform="matrix(1,0,0,1,0.220227,-14.0315)">
                  <text
                    x="30.5px"
                    y="19.056px"
                    text-anchor="middle"
                  >
                    {{ stepsXY[3] }}
                  </text>
                </g>
              </g>
            </g>
          </g>
          <a
            v-if="printerSupportsLeveling"
            class="cc-btn"
            :class="levelingClasses"
            @click="sendLevelingGcode"
          >
            <circle
              class="cc-btn-container"
              cx="70.92"
              cy="31"
              r="5"
            />
            <g>
              <path d="M74.189,31.503L67.751,30.009L67.638,30.496L74.076,31.99L74.189,31.503Z M74.361,32.85L74.034,32.676L74.939,32.188L75.039,33.211L74.745,33.055C74.386,33.724 73.858,34.288 73.213,34.69L72.983,34.321C73.563,33.959 74.038,33.452 74.361,32.85ZM67.193,28.75C67.586,28.1 68.142,27.564 68.807,27.196L69.018,27.576C68.42,27.907 67.919,28.389 67.565,28.974L67.883,29.165L66.954,29.605L66.907,28.578L67.193,28.75Z" />
            </g>
          </a>
          <a
            v-else
            class="cc-btn primary"
            :class="motorsOffClasses"
            @click="sendGcode('M84')"
          >
            <circle
              class="cc-btn-container"
              cx="70.92"
              cy="31"
              r="5"
            />
            <g transform="scale(0.3) translate(224,91)">
              <path d="M3.78 2.5L21.5 20.22l-1.27 1.28L18 19.27V20h-8l-2-2H5v-3H3v3H1v-8h2v3h2v-3l1.87-1.86L2.5 3.77L3.78 2.5M20 9v3h-2V8h-6V6h3V4H7.82l15 15H23V9h-3Z" />
            </g>
          </a>
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

@Component({})
export default class ToolheadControlCircle extends Mixins(StateMixin, ToolheadMixin) {
  get enableXYHoming (): boolean {
    return this.$store.state.config.uiSettings.general.toolheadControlXYHomingEnabled as boolean
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

  sendMoveGcode (axis: string, distance: number | string, negative = false) {
    axis = axis.toLowerCase()
    const rate = (axis.toLowerCase() === 'z')
      ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
      : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
    const inverted = this.$store.state.config.uiSettings.general.axis[axis].inverted || false
    distance = ((negative && !inverted) || (!negative && inverted))
      ? '-' + distance
      : distance

    if (this.forceMove) {
      const accel = (axis.toLowerCase() === 'z')
        ? this.$store.getters['printer/getPrinterSettings']('printer.max_z_accel')
        : this.$store.state.printer.printer.toolhead.max_accel
      this.sendGcode(`FORCE_MOVE STEPPER=stepper_${axis} DISTANCE=${distance} VELOCITY=${rate} ACCEL=${accel}`)
    } else {
      this.sendGcode(`G91
      G1 ${axis}${distance} F${rate * 60}
      G90`)
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

    this.sendGcode(`G1 X${bedCenter.x} Y${bedCenter.y} F${rate * 60}`)
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
    .cc-lbls {
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
    font-family: 'Roboto-Regular', 'Roboto', sans-serif;
    font-size: 3px;
    max-height: 350px;
    min-height: 275px;
    user-select: none;
    filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.2)) drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.14)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.12));

    .cc-btn {
      stroke-width: 0;

      .cc-btn-container {
        fill: var(--v-btncolor-base);
        stroke: var(--v-btncolor-darken4);
        stroke-width: 0.2px;
      }

      &:hover .cc-btn-container {
        fill: var(--v-btncolor-lighten1);
        transition-duration: 0.28s;
        transition-property: fill;
        transition-timing-function: map-get($transition, 'fast-out-slow-in');
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

    .cc-lbls {
      pointer-events: none;
      stroke-width: 0;
    }

    .large {
      font-size: 5px;
    }

    .disabled {
      pointer-events: none;
    }
  }
</style>
