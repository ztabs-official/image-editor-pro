// Chrome Extension API type definitions
declare namespace chrome {
  namespace storage {
    namespace local {
      function set(items: { [key: string]: any }, callback?: () => void): void;
      function get(keys?: string | string[] | null, callback?: (items: { [key: string]: any }) => void): Promise<{ [key: string]: any }>;
    }
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
    }

    function create(createProperties: { url: string }): void;
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }, callback?: (result: Tab[]) => void): Promise<Tab[]>;
    function captureVisibleTab(windowId?: number, options?: { format?: string }, callback?: (dataUrl: string) => void): Promise<string>;
  }

  namespace scripting {
    interface InjectionTarget {
      tabId: number;
    }

    interface ScriptInjection {
      target: InjectionTarget;
      func: () => any;
    }

    function executeScript(injection: ScriptInjection): Promise<any[]>;
  }

  namespace runtime {
    function getURL(path: string): string;
    
    interface InstalledDetails {
      reason: string;
    }
    
    interface MessageSender {
      tab?: Tab;
      frameId?: number;
      id?: string;
      url?: string;
    }
    
    const onInstalled: {
      addListener(callback: (details: InstalledDetails) => void): void;
    };
    
    const onMessage: {
      addListener(callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void): void;
    };
  }

  namespace contextMenus {
    interface CreateProperties {
      id: string;
      title: string;
      contexts: string[];
    }
    
    interface OnClickData {
      menuItemId: string;
      srcUrl?: string;
    }
    
    function create(createProperties: CreateProperties): void;
    
    const onClicked: {
      addListener(callback: (info: OnClickData, tab?: Tab) => void): void;
    };
  }
} 