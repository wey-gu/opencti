import React, { FunctionComponent } from 'react';
import { graphql, PreloadedQuery, usePreloadedQuery } from 'react-relay';
import Loader, { LoaderVariant } from '../../../../../components/Loader';
import useQueryLoading from '../../../../../utils/hooks/useQueryLoading';
import { UserDashboardQuery } from './__generated__/UserDashboardQuery.graphql';

interface UserDashboardProps {
  dashboardId: string
}

const userDashboardQuery = graphql`
  query UserDashboardQuery($id: String!) {
    workspace(id: $id) {
      name
    }
  }
`;

interface UserDashboardNameDisplayProps {
  userDashboardQueryRef: PreloadedQuery<UserDashboardQuery>
}

const UserDashboardNameDisplay: FunctionComponent<UserDashboardNameDisplayProps> = ({ userDashboardQueryRef }) => {
  const dashboardData = usePreloadedQuery(userDashboardQuery, userDashboardQueryRef);

  return (
    <>
      {dashboardData.workspace?.name}
    </>
  );
};

const UserDashboard: FunctionComponent<UserDashboardProps> = ({ dashboardId }) => {
  const userDashboardQueryRef = useQueryLoading<UserDashboardQuery>(userDashboardQuery, { id: dashboardId });

  return (
    <>
      {userDashboardQueryRef && (
        <React.Suspense fallback={<Loader variant={LoaderVariant.inElement}/>}>
          <UserDashboardNameDisplay userDashboardQueryRef={userDashboardQueryRef}/>
        </React.Suspense>
      )}
    </>
  );
};

export default UserDashboard;
