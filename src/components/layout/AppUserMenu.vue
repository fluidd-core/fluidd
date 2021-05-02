<template>
  <v-menu
    :nudge-width="100"
    offset-y
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        icon
        @click="$emit('drawer')">
        <v-icon>$account</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-list class="py-0">

        <v-list-item>
          <v-list-item-avatar>
            <v-icon>$account</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>User Account</v-list-item-title>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn
              class="red--text"
              icon
              @click="$emit('logout')"
            >
              <v-icon>mdi-heart</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

      </v-list>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="primary"
          text
          @click="$emit('logout')"
        >
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>
