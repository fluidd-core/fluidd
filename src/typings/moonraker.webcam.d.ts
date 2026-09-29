declare namespace Moonraker.Webcam {
  export interface ListResponse {
    webcams: Entry[];
  }

  export interface PostItemResponse {
    webcam: Entry;
  }

  export interface DeleteItemResponse {
    webcam: Entry;
  }

  export interface Entry {
    name?: string;
    location?: string;
    service?: Service;
    enabled?: boolean;
    icon?: string;
    target_fps?: number;
    target_fps_idle?: number;
    stream_url?: string;
    snapshot_url?: string;
    flip_horizontal?: boolean;
    flip_vertical?: boolean;
    rotation?: Rotation;
    aspect_ratio?: string;
    extra_data?: Record<string, unknown>;
    source: Source;
    uid: string;
  }

  export type Service = 'mjpegstreamer' | 'mjpegstreamer-adaptive' | 'ipstream' | 'iframe' | 'hlsstream' | 'webrtc-camerastreamer' | 'webrtc-go2rtc' | 'webrtc-mediamtx' | 'uv4l-mjpeg' | 'device'

  export type Rotation = 0 | 90 | 180 | 270

  export type Source = 'config' | 'database'

  // Updates by `uid`, else by `name` (creating the webcam, which then also needs `stream_url`)
  export type PostItemParams = Omit<Entry, 'source' | 'uid' | 'name'> & (
    {
      uid: string,
      name?: string
    } | {
      name: string
    }
  )
}

declare namespace Moonraker {
  export interface Methods {
    'server.webcams.list': {
      params: undefined,
      result: Webcam.ListResponse
    },
    'server.webcams.post_item': {
      params: Webcam.PostItemParams,
      result: Webcam.PostItemResponse
    },
    'server.webcams.delete_item': {
      params: {
        uid: string
      } | {
        name: string
      },
      result: Webcam.DeleteItemResponse
    }
  }

  export interface Notifications {
    notify_webcams_changed: [Webcam.ListResponse]
  }
}
