'use client';

import React, { createContext, useContext } from 'react';
import tunnel from 'tunnel-rat';

export const EditorCommandTunnelContext = createContext<any>(null);

export const useEditorCommandTunnel = () => {
  const context = useContext(EditorCommandTunnelContext);
  if (!context) {
    throw new Error('useEditorCommandTunnel must be used within EditorCommandTunnelContext');
  }
  return context;
};
