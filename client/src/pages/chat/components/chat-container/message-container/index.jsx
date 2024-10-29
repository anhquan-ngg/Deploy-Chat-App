import {useAppStore} from "@/store/index.js";
import {useRef, useEffect, useState} from "react";
import moment from "moment";
import {GET_ALL_MESSAGES_ROUTE, GET_CHANNEL_MESSAGES_ROUTE, HOST} from "@/utils/constants.js";
import {apiClient} from "@/lib/api-client.js";
import {MdFolderZip} from "react-icons/md";
import {IoMdArrowRoundDown} from "react-icons/io";
import {IoCloseSharp} from "react-icons/io5";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar.jsx";
import {getColor} from "@/lib/utils.js";

const MessageContainer = () => {
  const scrollRef = useRef();
  const {selectedChatType, selectedChatData, userInfo, selectedChatMessages, setSelectedChatMessages, setIsDownloading, setFileDownloadProgress} = useAppStore();
    const [showImage, setShowImage] = useState(false);
    const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
        try {
          const response = await apiClient.post(
              GET_ALL_MESSAGES_ROUTE,
              {id: selectedChatData._id},
              {withCredentials: true}
          );
          if (response.data.messages){
            setSelectedChatMessages(response.data.messages);
          }
        } catch (error){
          console.log({error});
        }
    }

    const getChannelMessages = async () => {
        try {
            const response = await apiClient.get(
                `${GET_CHANNEL_MESSAGES_ROUTE}/${selectedChatData._id}`,
                {withCredentials: true},
            );
            if (response.data.messages){
                setSelectedChatMessages(response.data.messages);
            }
        } catch (error) {
            console.log({error});
        }
    }

    if (selectedChatData._id){
      if (selectedChatType === "contact") getMessages();
      else if  (selectedChatType === "channel") getChannelMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({behavior: "smooth"});
    }
  }, [selectedChatMessages]);

  const checkIfImage = (filepath) => {
      const imageRegex =
          /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
      return imageRegex.test(filepath);
  };

    const renderMessage = () => {
        let lastDate = null;
        return selectedChatMessages.map((message) => {
            const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
            const showDate = messageDate !== lastDate;
            lastDate = messageDate;
            return (
                <div key={message._id}>
                    {showDate && (
                        <div className="text-center text-gray-500 my-2">
                            {moment(message.timestamp).format("LL")}
                        </div>
                    )}
                    {
                        selectedChatType === "contact" && renderDMMessages(message)
                    }
                    {
                        selectedChatType === "channel" && renderChannelMessages(message)
                    }
                </div>
            )
        });
    }

    const downloadFile = async (url) => {
        setIsDownloading(true);
        setFileDownloadProgress(0);
        const response = await apiClient.get(`${HOST}/${url}`, {
            responseType: "blob", // blob: binary large object
            onDownloadProgress: (progressEvent) => {
                const {loaded, total} = progressEvent;
                const percentCompleted = Math.round((loaded * 100) / total);
                setFileDownloadProgress(percentCompleted);
          }
      });
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = urlBlob;
      link.setAttribute("download", url.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
      setIsDownloading(false);
      setFileDownloadProgress(0);
  }

  const renderDMMessages = (message) => (
      <div className={`${message.sender === selectedChatData._id ? "text-left" : "text-right"}`}>
          {message.messageType === "text" && (
              <div
                  className={`${message.sender !== selectedChatData._id 
                      ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50" 
                      : "bg-[#2a2b33]/5 text-white/90 border-[#ffffff]/20"
                  } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}>
                  {message.content}
              </div>
          )}
          {message.messageType === "file" && (
              <div
                  className={`${message.sender !== selectedChatData._id
                      ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                      : "bg-[#2a2b33]/5 text-white/90 border-[#ffffff]/20"
                  } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}>
                  {checkIfImage(message.fileUrl)
                      ? <div
                          className="cursor-pointer"
                          onClick={() => {
                              setShowImage(true);
                              setImageURL(message.fileUrl);
                          }}
                      >
                          <img src={`${HOST}/${message.fileUrl}`} height={300} width={300} />
                      </div>
                      : <div className="flex items-center justify-center gap-4 cursor-pointer">
                          <span className="text-white/8- text-3xl bg-black/20 rounded--full p-3">
                              <MdFolderZip/>
                          </span>
                          <span>{message.fileUrl.split('/').pop()}</span>
                          <span
                              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                              onClick={() => downloadFile(message.fileUrl)}
                          >
                              <IoMdArrowRoundDown/>
                          </span>
                      </div>}
              </div>
          )}

          <div className="text-xs text-gray-600">
              {moment(message.timestamp).format("LT")}
          </div>
      </div>
  )

    const renderChannelMessages = (message) => (
        <div className={`mt-5 ${message.sender._id === userInfo.id ? "text-right" : "text-left"}`}>
            {message.messageType === "text" && (
                <div
                    className={`${message.sender._id === userInfo.id
                        ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                        : "bg-[#2a2b33]/5 text-white/90 border-[#ffffff]/20"
                    } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}>
                    {message.content}
                </div>
            )}
            {message.messageType === "file" && (
                <div
                    className={`${message.sender._id === userInfo.id
                        ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                        : "bg-[#2a2b33]/5 text-white/90 border-[#ffffff]/20"
                    } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}>
                    {checkIfImage(message.fileUrl)
                        ? <div
                            className="cursor-pointer"
                            onClick={() => {
                                setShowImage(true);
                                setImageURL(message.fileUrl);
                            }}
                        >
                            <img src={`${HOST}/${message.fileUrl}`} height={300} width={300}/>
                        </div>
                        : <div className="flex items-center justify-center gap-4 cursor-pointer">
                          <span className="text-white/8- text-3xl bg-black/20 rounded--full p-3">
                              <MdFolderZip/>
                          </span>
                            <span>{message.fileUrl.split('/').pop()}</span>
                            <span
                                className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                                onClick={() => downloadFile(message.fileUrl)}
                            >
                              <IoMdArrowRoundDown/>
                          </span>
                        </div>}
                </div>
            )}
            {
                message.sender._id !== userInfo.id
                    ? <div className="flex items-center justify-start gap-3">
                        <Avatar className="h-6 w-6 rounded-full overflow-hidden">
                            {message.sender.image && (
                                <AvatarImage
                                    src={`${HOST}/${message.sender.image}`}
                                    alt="profile"
                                    className="object-cover w-full h-full bg-black"
                                />
                            )}
                            <AvatarFallback
                                className={`uppercase h-6 w-6 text-sm flex items-center justify-center rounded-full ${getColor(
                                    message.sender.color
                                )}`}
                            >
                                {message.sender.firstName
                                    ? message.sender.firstName.split("").shift()
                                    : (message.sender.email ? message.sender.email.split("").shift() : "")
                                }
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-white/60">{`${message.sender.firstName} ${message.sender.lastName}`}</span>
                        <span className="text-xs text-white/60">
                            {moment(message.timestamp).format("LT")}
                        </span>
                    </div>
                    : <div className="text-xs text-white/60">
                        {moment(message.timestamp).format("LT")}
                    </div>
            }
        </div>

    )

    return (
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
            {renderMessage()}
            <div ref={scrollRef}/>
            {
                showImage && (
                    <div
                        className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col">
                        <div>
                            <img
                                src={`${HOST}/${imageURL}`}
                                className="h-[80vh] w-full bg-cover"
                            />
                            <div className="flex gap-5 fixed top-0 right-0 mt-5">
                                <button
                                    className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                                    onClick={() => downloadFile(imageURL)}
                                >
                                    <IoMdArrowRoundDown/>
                                </button>
                                <button
                                    className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                                    onClick={() => {
                                        setShowImage(false);
                                        setImageURL(null);
                                    }}
                                >
                                    <IoCloseSharp/>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default MessageContainer;