import React, { FunctionComponent, useState } from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import MarkdownWithRedirectionWarning from './MarkdownWithRedirectionWarning';

interface ExpandableMarkdownProps {
  source: string | null,
  limit: number,
}

const ExpandableMarkdown: FunctionComponent<ExpandableMarkdownProps> = ({ source, limit }) => {
  const [expand, setExpand] = useState(false);

  const onClick = () => setExpand(!expand);
  const shouldBeTruncated = (source || '').length > limit;

  return (
    <span>
    {source
      ? <div style={{ position: 'relative' }}>
        {shouldBeTruncated && (
          <div style={{ position: 'absolute', top: -32, right: 0 }}>
            <IconButton onClick={onClick} size="large">
              {expand ? <ExpandLess/> : <ExpandMore/>}
            </IconButton>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <MarkdownWithRedirectionWarning
            expand={expand}
            content={source}
            limit={limit}
            remarkGfmPlugin={true}
            markdownComponents={true}
          ></MarkdownWithRedirectionWarning>
        </div>
        <div className="clearfix"/>
      </div>
      : ('-')
    }
    </span>
  );
};

export default ExpandableMarkdown;
