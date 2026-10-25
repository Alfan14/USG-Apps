/**
 * Contoh component test untuk Badge.
 * Sesuaikan path import sesuai struktur project asli.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../src/components/Badge';

describe('Badge', () => {
  it('merender label dengan benar', () => {
    const { getByText } = render(<Badge label="Selesai" />);
    expect(getByText('Selesai')).toBeTruthy();
  });

  it('menerima variant green', () => {
    const { getByText } = render(<Badge label="Video tersedia" variant="green" />);
    expect(getByText('Video tersedia')).toBeTruthy();
  });
});
