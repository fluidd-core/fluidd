<template>
  <v-menu
    :nudge-width="100"
    offset-y
  >
    <template v-slot:activator="{ on, attrs }">
      <v-badge
        :value="true"
        :content="5"
        offset-x="22"
        offset-y="22"
        bordered
        overlap
      >
        <v-btn
          v-bind="attrs"
          v-on="on"
          icon
          color="primary"
          @click="$emit('drawer')">
          <v-icon>$bell</v-icon>
        </v-btn>
      </v-badge>
    </template>

    <v-card>
      <v-list class="py-0">

        <v-list-item two-line>
          <v-list-item-icon><v-icon>$refresh</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Updates are Available</v-list-item-title>
            <v-list-item-subtitle>Today, 11:00am</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider />

        <v-list-item two-line>
          <v-list-item-icon><v-icon color="error">$error</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Warning, CPU Undervoltage</v-list-item-title>
            <v-list-item-subtitle>Today, 11:00am</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

      </v-list>
    </v-card>
  </v-menu>
</template>
