import { NewProjectNotification } from "../../projects/notifications/new-project-notification/NewProjectNotification";
import { DiscoveryNotifications } from "../../system/components/discovery-notifications/DiscoveryNotifications";
import { NewTempfileNotification } from "../../tempfiles/notifications/new-tempfile-notification/NewTempfileNotification";

export default function Notifications() {
	return (
		<>
			<NewProjectNotification />
			<DiscoveryNotifications />
			<NewTempfileNotification />
		</>
	);
}
