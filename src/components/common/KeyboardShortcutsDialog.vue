<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="850"
    scrollable
  >
    <v-card>

      <v-card-title class="card-heading py-2 px-5">
        <span class="focus--text">
          {{ $t('app.file_system.title.keyboard_shortcuts') }}
        </span>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-simple-table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Windows / Linux</th>
              <th>Mac</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Search</td>
              <td>Ctrl + F</td>
              <td>Command + F</td>
            </tr>

            <tr>
              <td>Increase Indent</td>
              <td>Tab</td>
              <td>Tab</td>
            </tr>

            <tr>
              <td>Decrease Indent</td>
              <td>Shift + Tab</td>
              <td>Shift + Tab</td>
            </tr>

            <tr>
              <td>Comment Out</td>
              <td>Ctrl + /</td>
              <td>Command + /</td>
            </tr>

            <tr>
              <td>Comment In</td>
              <td>Ctrl + /</td>
              <td>Command + /</td>
            </tr>

            <tr>
              <td>Undo</td>
              <td>Ctrl + Z</td>
              <td>Command + Z</td>
            </tr>

            <tr>
              <td>Redo</td>
              <td>Ctrl + Y</td>
              <td>Shift + Command + Z or Command + Y</td>
            </tr>

            <tr>
              <td>Decrease Indent</td>
              <td>Ctrl + [</td>
              <td>Command + [</td>
            </tr>

            <tr>
              <td>Increase Indent</td>
              <td>Ctrl + ]</td>
              <td>Command + ]</td>
            </tr>

            <tr>
              <td>Move the line down</td>
              <td>Alt + Down</td>
              <td>Option + Down</td>
            </tr>

            <tr>
              <td>Move the line up</td>
              <td>Alt + Up</td>
              <td>Option + Up</td>
            </tr>

            <tr>
              <td>Replace</td>
              <td>Ctrl + F</td>
              <td>Command + Alt + F</td>
            </tr>

            <tr>
              <td>Select all</td>
              <td>Ctrl + A</td>
              <td>Command + A</td>
            </tr>

            <tr>
              <td>Select downward</td>
              <td>Shift + Down</td>
              <td>Shift + Down</td>
            </tr>

            <tr>
              <td>Select right</td>
              <td>Shift + Right</td>
              <td>Shift + Right</td>
            </tr>

            <tr>
              <td>Select left</td>
              <td>Shift + Left</td>
              <td>Shift + Left</td>
            </tr>

            <tr>
              <td>Select upward</td>
              <td>Shift + Up</td>
              <td>Shift + Up</td>
            </tr>

            <tr>
              <td>Select to the end</td>
              <td>Alt + Shift + Right</td>
              <td>Command + Shift + Right</td>
            </tr>

            <tr>
              <td>Select to the start</td>
              <td>Alt + Shift + Left</td>
              <td>Command + Shift + Left</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class VersionInformationDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean
}
</script>
