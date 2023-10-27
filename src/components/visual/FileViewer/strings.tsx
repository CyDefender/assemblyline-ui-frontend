import { Alert, LinearProgress } from '@mui/material';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useMyAPI from 'components/hooks/useMyAPI';
import { CustomUser } from 'components/hooks/useMyUser';
import ForbiddenPage from 'components/routes/403';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import MonacoEditor, { LANGUAGE_SELECTOR } from '../MonacoEditor';
import SimpleSearchQuery from '../SearchBar/simple-search-query';

const DIFF_QUERY = 'diff';

type Props = {
  sha256: string;
  type?: string;
  load?: boolean;
};

const WrappedStringsSection: React.FC<Props> = ({ sha256, type: propType = null, load = true }) => {
  const location = useLocation();
  const { apiCall } = useMyAPI();
  const { user: currentUser } = useAppUser<CustomUser>();

  const [data, setData] = useState<string>(null);
  const [error, setError] = useState<string>(null);
  const [diffData, setDiffData] = useState<string>(null);

  const type = useMemo<string>(() => (propType && propType in LANGUAGE_SELECTOR ? propType : 'unknown'), [propType]);
  const diffSha256 = useMemo<string>(() => {
    const query = new SimpleSearchQuery(location.search);
    return query.has(DIFF_QUERY) ? query.get(DIFF_QUERY) : null;
  }, [location.search]);

  useEffect(() => {
    if (!sha256 || data || !load) return;
    apiCall({
      url: `/api/v4/file/strings/${sha256}/`,
      allowCache: true,
      onEnter: () => {
        setData(null);
        setError(null);
      },
      onSuccess: api_data => setData(api_data.api_response),
      onFailure: api_data => setError(api_data.api_error_message)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, load, sha256]);

  useEffect(() => {
    if (!diffSha256 || !load) return;
    apiCall({
      url: `/api/v4/file/strings/${diffSha256}/`,
      allowCache: true,
      onEnter: () => setDiffData(null),
      onSuccess: api_data => setDiffData(api_data.api_response),
      onFailure: api_data => setError(api_data.api_error_message)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, load, sha256]);

  if (!currentUser.roles.includes('file_detail')) return <ForbiddenPage />;
  else if (error) return <Alert severity="error">{error}</Alert>;
  else if (!data) return <LinearProgress />;
  else
    return (
      <MonacoEditor
        diff={!!diffSha256}
        value={!diffSha256 ? data : null}
        modified={diffSha256 ? data : null}
        original={diffSha256 ? diffData : null}
        language={LANGUAGE_SELECTOR[type]}
        options={{ links: false, readOnly: true }}
      />
    );
};

export const StringsSection = React.memo(WrappedStringsSection);
export default StringsSection;

// import Editor, { loader } from '@monaco-editor/react';
// import { Alert, LinearProgress } from '@mui/material';
// import makeStyles from '@mui/styles/makeStyles';
// import useAppTheme from 'commons/components/app/hooks/useAppTheme';
// import useAppUser from 'commons/components/app/hooks/useAppUser';
// import useMyAPI from 'components/hooks/useMyAPI';
// import { CustomUser } from 'components/hooks/useMyUser';
// import ForbiddenPage from 'components/routes/403';
// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import ReactResizeDetector from 'react-resize-detector';

// const useStyles = makeStyles(theme => ({
//   container: {
//     flexGrow: 1,
//     border: `1px solid ${theme.palette.divider}`,
//     position: 'relative'
//   },
//   innerContainer: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     left: 0,
//     right: 0
//   }
// }));

// type Props = {
//   sha256: string;
//   type?: string;
//   load?: boolean;
// };

// const WrappedStringsSection: React.FC<Props> = ({ sha256, type: propType = null, load = true }) => {
//   const { apiCall } = useMyAPI();
//   const classes = useStyles();
//   const { i18n } = useTranslation();
//   const containerEL = useRef<HTMLDivElement>();
//   const { isDark: isDarkTheme } = useAppTheme();
//   const { user: currentUser } = useAppUser<CustomUser>();

//   const [data, setData] = useState<string>(null);
//   const [error, setError] = useState(null);

//   const type = useMemo<string>(() => (propType ? propType : 'unknown'), [propType]);

//   useEffect(() => {
//     // I cannot find a way to hot switch monaco editor's locale but at least I can load
//     // the right language on first load...
//     if (i18n.language === 'fr') {
//       loader.config({ 'vs/nls': { availableLanguages: { '*': 'fr' } } });
//     } else {
//       loader.config({ 'vs/nls': { availableLanguages: { '*': '' } } });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const languageSelector = {
//     'text/json': 'json',
//     'text/jsons': 'json',
//     'code/vbe': 'vb',
//     'code/vbs': 'vb',
//     'code/wsf': 'xml',
//     'code/batch': 'bat',
//     'code/ps1': 'powershell',
//     'text/ini': 'ini',
//     'text/autorun': 'ini',
//     'code/java': 'java',
//     'code/python': 'python',
//     'code/php': 'php',
//     'code/shell': 'shell',
//     'code/xml': 'xml',
//     'code/yaml': 'yaml',
//     'code/javascript': 'javascript',
//     'code/jscript': 'javascript',
//     'code/typescript': 'typescript',
//     'code/xfa': 'xml',
//     'code/html': 'html',
//     'code/hta': 'html',
//     'code/html/component': 'html',
//     'code/csharp': 'csharp',
//     'code/jsp': 'java',
//     'code/c': 'cpp',
//     'code/h': 'cpp',
//     'code/clickonce': 'xml',
//     'code/css': 'css',
//     'code/markdown': 'markdown',
//     'code/sql': 'sql',
//     'code/go': 'go',
//     'code/ruby': 'ruby',
//     'code/perl': 'perl',
//     'code/rust': 'rust',
//     'code/lisp': 'lisp'
//   };

//   useEffect(() => {
//     if (!sha256 || data || !load) return;
//     apiCall({
//       url: `/api/v4/file/strings/${sha256}/`,
//       allowCache: true,
//       onSuccess: api_data => setData(api_data.api_response),
//       onFailure: api_data => setError(api_data.api_error_message),
//       onEnter: () => setError(null)
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [data, load, sha256]);

//   useEffect(() => {
//     setData(null);
//     setError(null);
//   }, [sha256]);

//   return !currentUser.roles.includes('file_detail') ? (
//     <ForbiddenPage />
//   ) : data ? (
//     <div ref={containerEL} className={classes.container}>
//       <div className={classes.innerContainer}>
//         <ReactResizeDetector handleHeight handleWidth targetRef={containerEL}>
//           {({ width, height }) => (
//             <div ref={containerEL}>
//               <Editor
//                 language={languageSelector[type]}
//                 width={width}
//                 height={height}
//                 theme={isDarkTheme ? 'vs-dark' : 'vs'}
//                 value={data}
//                 options={{ links: false, readOnly: true }}
//               />
//             </div>
//           )}
//         </ReactResizeDetector>
//       </div>
//     </div>
//   ) : error ? (
//     <Alert severity="error">{error}</Alert>
//   ) : (
//     <LinearProgress />
//   );
// };

// export const StringsSection = React.memo(WrappedStringsSection);
// export default StringsSection;
