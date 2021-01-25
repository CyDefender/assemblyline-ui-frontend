import PageCenter from 'commons/components/layout/pages/PageCenter';
import useMyLayout from 'components/hooks/useMyLayout';
import LinkGrid from 'components/layout/linkgrid';
import React from 'react';

export default function Statistics() {
  const layout = useMyLayout();
  let items = [];
  for (const item of layout.leftnav.elements) {
    if (item.type === 'group' && item.element.id === 'stats') {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      items = item.element['items'];
    }
  }

  return (
    <PageCenter margin={4} width="100%">
      <LinkGrid items={items} />
    </PageCenter>
  );
}