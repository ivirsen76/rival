import type { Association } from '@rival/club.backend/src/types';
import { createContext } from 'react';

type AssociationContextValue = Association;

export const AssociationContext = createContext<AssociationContextValue | undefined>(undefined);
