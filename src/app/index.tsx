import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { QueryCache, ReactQueryCacheProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query-devtools';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import '@app/app.css';
import {
  PollingContextProvider,
  LocalStorageContextProvider,
  NetworkContextProvider,
} from '@app/common/context';

const queryCache = new QueryCache();

const App: React.FunctionComponent = () => (
  <ReactQueryCacheProvider queryCache={queryCache}>
    <PollingContextProvider>
      <LocalStorageContextProvider>
        <NetworkContextProvider>
          <Router>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </Router>
        </NetworkContextProvider>
      </LocalStorageContextProvider>
    </PollingContextProvider>
    <ReactQueryDevtools />
  </ReactQueryCacheProvider>
);

export { App };
