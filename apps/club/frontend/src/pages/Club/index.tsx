import { useMemo } from 'react';
import Loader from '@rival/common/components/Loader';
import useSettings from '@rival/common/utils/useSettings';
import type { RouteComponentProps } from 'react-router-dom';
import Error from '@rival/common/components/Error';
import Card from '@rival/common/components/Card';

type ClubProps = RouteComponentProps<{ associationSlug: string; clubSlug: string }>;

const Club = (props: ClubProps) => {
    const { associationSlug, clubSlug } = props.match.params;
    const { settings, isSettingsLoading } = useSettings();

    const club = useMemo(() => {
        if (!settings) {
            return null;
        }

        const association = settings.associations.find((item) => item.slug === associationSlug);
        if (!association) {
            return null;
        }

        return association.clubs.find((item) => item.slug === clubSlug);
    }, [settings, associationSlug, clubSlug]);

    if (isSettingsLoading) {
        return <Loader loading />;
    }

    if (!club) {
        return <Error message="The club is not found" />;
    }

    console.log(club);

    return (
        <div>
            <Card>
                <div>Club</div>
                <div>{club.name}</div>
            </Card>
        </div>
    );
};

export default Club;
