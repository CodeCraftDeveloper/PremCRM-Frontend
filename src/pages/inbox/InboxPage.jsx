import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearActiveConversation } from "../../store/slices/inboxSlice";
import ChannelSidebar from "./ChannelSidebar";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";

const InboxPage = () => {
  const dispatch = useDispatch();
  const { activeConversation } = useSelector((state) => state.inbox);

  useEffect(() => {
    return () => {
      dispatch(clearActiveConversation());
    };
  }, [dispatch]);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[640px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="hidden lg:block">
        <ChannelSidebar />
      </div>

      <div className={`${activeConversation ? "hidden lg:flex" : "flex"} h-full`}>
        <ConversationList />
      </div>

      <div className={`${activeConversation ? "flex" : "hidden lg:flex"} h-full flex-1`}>
        <MessageThread />
      </div>
    </div>
  );
};

export default InboxPage;
